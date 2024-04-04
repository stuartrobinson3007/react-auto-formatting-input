import {
  SelectionPattern,
  SelectionPatternWithIndexes,
  Pattern,
} from "./types";

export function assignIndexesToPattern(
  pattern: SelectionPattern[]
): SelectionPatternWithIndexes[] {
  let index = 0;

  return pattern.map((item) => {
    let start = index;
    let end = index;

    if ("insertCharCount" in item) {
      index += item.insertCharCount;
      end = index;
    } else {
      index += item.valueCharCount;
      end = index;
    }

    return {
      pattern: item,
      start,
      end,
    };
  });
}

// This finds both the formatted and unformatted max length of the pattern
// We do this by first finding the unformatted length of the pattern
// Then using this to find the formatted length of the pattern
// Finding the unformatted length first is to give the formatted length fn a stopping point
export function getPatternLength(pattern: Pattern[]): {
  formattedLength: number;
  unformattedLength: number;
} {
  // Define a recursive function that will reduce the pattern to a single length number
  // If countInserts is true, we will count the length of the insert characters
  // If unformattedLength is not -1, we will stop the function when the length exceeds this value
  const reducePattern = (
    countInserts: boolean,
    unformattedLength: number = -1
  ) => {
    let length = 0;

    for (const item of pattern) {
      if ("insert" in item) {
        // Only if we're counting the inserts, add the length of the insert to the total length
        console.log("item.insert.length", item.insert.length);
        if (countInserts) length += item.insert.length;
      } else if ("repeat" in item) {
        // If the repeat times is -1, we will repeat the pattern indefinitely so the length is infinite
        if (item.repeat.times === -1) {
          return -1;
        }

        const _patternLength = getPatternLength(item.repeat.pattern);

        // If we're counting the inserts, we will add the formatted length of the pattern
        // Otherwise, we will add the unformatted length of the pattern
        // We multiply this by the number of times the pattern is repeated
        length +=
          (countInserts
            ? _patternLength.formattedLength
            : _patternLength.unformattedLength) * item.repeat.times;
      } else if ("backwards" in item) {
        const _patternLength = getPatternLength(item.backwards.pattern);

        // Note: If we want nested backwards patterns to work, this getPatternLength call would need to be adjusted to account for breakChar
        // At the moment, the entire backwards pattern is counted as one length
        // But it could in theory be shorter if there is a breakChar

        // If we're counting the inserts, we will add the formatted length of the pattern
        // Otherwise, we will add the unformatted length of the pattern
        length += countInserts
          ? _patternLength.formattedLength
          : _patternLength.unformattedLength;
      } else {
        length += item.quantity;
      }

      console.log("length", length);

      // If we're counting the inserts, break the loop once we've reached the end of the unformatted length
      if (unformattedLength !== -1 && length > unformattedLength) {
        break;
      }
    }

    return length;
  };

  // First find the unformatted length of the pattern
  const unformattedLength = reducePattern(false);

  // Then use this to find the formatted length of the pattern
  const formattedLength =
    unformattedLength === -1 ? -1 : reducePattern(true, unformattedLength);

  return { formattedLength, unformattedLength };
}

// The format function outputs both the new formatted value and the new unformatted value
// It also outputs a selection pattern which makes it easier to convert a user selection of formatted characters in the formatted input DOM element back into what the selection would be without the inserted formatting characters (so we can handle when the user makes a change)
export function format(
  rawValue: string,
  pattern: Pattern[]
): {
  formattedValue: string;
  newValue: string;
  selectPattern: SelectionPattern[];
} {
  let formattedValue = "";
  let newValue = "";
  let inputIndex = 0;

  const selectPattern = [] as SelectionPattern[];

  const handlePattern = (
    rawValue: string,
    pattern: Pattern[],
    options: {
      backwards?: boolean;
      breakChar?: string | null;
      repeat?: number;
    } = {
      backwards: false,
      breakChar: null,
      repeat: 0,
    }
  ) => {
    let _formattedValue = "";
    let _newValue = "";
    let _rawValue = rawValue;

    const _selectPattern = [] as SelectionPattern[];

    let _inputIndex = 0;

    // Because some inserts should be inserted as the user types the character before it, we have to handle when the loop should finish
    let addingAdditionalInserts = false;
    let reachedEndOfPatternPart = false;

    // And because this function outputs a selection pattern to help move the caret in the input, we want to add an extra empty "value" selection pattern at the end of the pattern so that the caret can be moved into it
    let didInsertAdditionalInsert = false;
    let needToAddExtraSelectionPattern = false;

    // If we're going backwards, reverse the raw value so the pattern gets applied backwards (then we reverse the value back at the end)
    if (options.backwards) {
      _rawValue = rawValue.split("").reverse().join("");
    }

    for (let i = 0; i < pattern.length; i++) {
      const item = pattern[i];

      if ("backwards" in item) {
        // To handle the backwards pattern, we need to know how much of the raw value to pass into the handlePattern function
        // This could either be by finding the length of the pattern or by finding the index of a break character

        // If both breakCharIndex and backwardsPatternLength are -1, we use the whole _rawValue
        // If one of them is not -1, set the length to that one
        // If both are not -1, set the length to the smaller of the two

        const breakChar = item.backwards.breakChar;

        const breakCharIndex = _rawValue.indexOf(breakChar) + _inputIndex;

        const backwardsPatternLength = getPatternLength(item.backwards.pattern);
        let __rawValue = _rawValue;

        let length = -1;

        if (
          breakCharIndex !== -1 &&
          backwardsPatternLength.formattedLength !== -1
        ) {
          // Find the smaller of the two lengths
          length = Math.min(
            breakCharIndex,
            backwardsPatternLength.formattedLength
          );
        } else if (breakCharIndex !== -1) {
          length = breakCharIndex;
        } else if (backwardsPatternLength.formattedLength !== -1) {
          length = backwardsPatternLength.formattedLength;
        }

        if (length !== -1) {
          __rawValue = _rawValue.slice(_inputIndex, length);
        }

        handlePattern(__rawValue, item.backwards.pattern, {
          ...options,
          backwards: true,
        });

        // Insert the break character if it's defined and found
        if (
          breakChar !== null &&
          breakCharIndex !== -1 &&
          length === breakCharIndex
        ) {
          formattedValue += breakChar;
          newValue += breakChar;
          inputIndex++; // TODO by breakChar.length
          _inputIndex++;

          _selectPattern.push({
            valueCharCount: breakChar.length,
          });
        }
      } else if ("repeat" in item) {
        handlePattern(rawValue, item.repeat.pattern, {
          ...options,
          repeat: item.repeat.times,
        });
      } else if ("insert" in item) {
        if (addingAdditionalInserts && !item.before) {
          // If we've reached the end of the user input, but we're doing a check for inserts that should be inserted after the user input, if this insert is not tagged as "before", then it should only be inserted after the user types the next character, not now, so we break
          break;
        }

        if (options.backwards) {
          _formattedValue += item.insert;
        } else {
          formattedValue += item.insert;
        }

        _selectPattern.push({
          insertCharCount: item.insert.length,
        });

        // If this was an additional insert that is being inserted after the user's last character, we track this so we can insert the empty "value" selection pattern at the end
        if (addingAdditionalInserts && item.before) {
          didInsertAdditionalInsert = true;
        }
      } else {
        // If we've reached the end of the user input, but we're doing a check for inserts that should be inserted after the user input, we only want to insert the empty "value" selection pattern at the end if there is another part of the input that the user can type into (i.e. another "quantity" tag).
        // If we've reached this part of the code, that is the case
        if (addingAdditionalInserts) {
          needToAddExtraSelectionPattern = true;
          break;
        }

        const quantity = item.quantity;
        let rawValueSegment = _rawValue.slice(
          inputIndex,
          inputIndex + quantity
        );

        // If this part of the input reaches the end of this part of the pattern, we will set this to check if we are at the end of the whole pattern
        reachedEndOfPatternPart = rawValueSegment.length === quantity;

        if (options.backwards) {
          _formattedValue += rawValueSegment;
          _newValue += rawValueSegment;
        } else {
          formattedValue += rawValueSegment;
          newValue += rawValueSegment;
        }

        inputIndex += rawValueSegment.length;
        _inputIndex += rawValueSegment.length;

        _selectPattern.push({
          valueCharCount: rawValueSegment.length,
        });
      }

      if (inputIndex >= rawValue.length) {
        if (reachedEndOfPatternPart) {
          addingAdditionalInserts = true;
          continue;
        } else {
          break;
        }
      }

      // If we're at the end of the pattern, handle if we're repeating this pattern
      if (i === pattern.length - 1) {
        if (!!options.repeat && (options.repeat > 0 || options.repeat === -1)) {
          handlePattern(rawValue, pattern, {
            ...options,
            repeat: options.repeat === -1 ? -1 : options.repeat - 1,
          });
        }
      }
    }

    // Reverse the formatted value and new value if we're going backwards so they're back in the correct order
    if (options.backwards) {
      _formattedValue = _formattedValue.split("").reverse().join("");
      _newValue = _newValue.split("").reverse().join("");
      _selectPattern.reverse();

      formattedValue += _formattedValue;
      newValue += _newValue;
    }

    // If we inserted an additional insert that needed to go in before the user types another character, we add the empty "value" selection pattern at the end so that the caret can be moved into it
    if (needToAddExtraSelectionPattern) {
      _selectPattern.push({
        valueCharCount: 0,
      });
    }

    selectPattern.push(..._selectPattern);
  };

  handlePattern(rawValue, pattern);

  return { formattedValue, newValue, selectPattern };
}

// This function is used to get the selection start and end values without the inserted characters
export function getSelectionWithoutFormatting(
  selection: { start: number; end: number },
  selectPattern: SelectionPattern[]
) {
  const { start, end } = selection;

  let startOffset = 0;
  let endOffset = 0;

  let index = 0;

  let startDone = false;

  // Loop through the pattern and for every insert, increment the offset and index by the length of the insert
  // For every quantity, increment the index by the quantity
  // Break the loop when the index is greater than the end value

  for (const item of selectPattern) {
    if ("insertCharCount" in item) {
      const increment = Math.min(item.insertCharCount, end - index);
      endOffset += increment;

      if (!startDone) {
        startOffset += increment;
      }

      index += increment;
    } else {
      const increment = Math.min(item.valueCharCount, end - index);

      index += increment;
    }

    if (index >= start) {
      startDone = true;
    }

    if (index >= end) {
      break;
    }
  }

  return {
    start: Math.max(0, start - startOffset),
    end: Math.max(0, end - endOffset),
  };
}

// A utility function used in the getIndexWithFormatting function
// This function finds the next non-insert pattern using a starting index and a direction
// It will keep going in the direction until it finds a non-insert pattern
// And reverse the search if it reaches the end of the array
export const findNextNonInsertPattern = (
  patternsWithIndexes: SelectionPatternWithIndexes[],
  index: number,
  startDirection: "backward" | "forward",
  attemptReverse = true
): SelectionPatternWithIndexes | null => {
  const increment = startDirection === "backward" ? -1 : 1;
  let currentIndex = index + increment;

  while (currentIndex >= 0 && currentIndex < patternsWithIndexes.length) {
    const element = patternsWithIndexes[currentIndex];

    if ("insert" in element) {
      currentIndex += increment;
    } else {
      return patternsWithIndexes[currentIndex];
    }
  }

  if (attemptReverse) {
    return findNextNonInsertPattern(
      patternsWithIndexes,
      currentIndex,
      startDirection === "backward" ? "forward" : "backward",
      false
    );
  }
  return null;
};

export function getIndexWithFormatting(
  index: number,
  patternsWithIndexes: SelectionPatternWithIndexes[],
  direction: "forward" | "backward" = "forward"
) {
  let offset = 0;

  let count = 0;

  for (let i = 0; i < patternsWithIndexes.length; i++) {
    const pattern = patternsWithIndexes[i].pattern;

    if ("insertCharCount" in pattern) {
      const increment = pattern.insertCharCount;

      offset += increment;
    } else {
      const increment = Math.min(pattern.valueCharCount, index - count);

      offset += increment;

      // If the direction is forward and we're at the end of the quantity, add any of the next inserts until we reach another quantity
      if (
        direction === "forward" &&
        index - count === pattern.valueCharCount &&
        i < patternsWithIndexes.length - 1
      ) {
        const nextNonInsert = findNextNonInsertPattern(
          patternsWithIndexes,
          i + 1,
          "forward"
        );

        if (nextNonInsert) {
          offset = nextNonInsert.start;
        }
      }

      count += increment;
    }

    if (count >= index) {
      break;
    }
  }

  return offset;
}

export function checkForNestedBackwardsPattern(pattern: Pattern[]): boolean {
  const handleCheck = (pattern: Pattern[], count: number) => {
    for (const item of pattern) {
      if ("backwards" in item) {
        count++;

        if (count > 1) {
          return true;
        }

        handleCheck(item.backwards.pattern, count);
      } else if ("repeat" in item) {
        handleCheck(item.repeat.pattern, count);
      }
    }

    return false;
  };

  return handleCheck(pattern, 0);
}

export function checkForMultiCharacterBreakChars(pattern: Pattern[]): boolean {
  let breakCharCount = 0;

  const handleCheck = (pattern: Pattern[]) => {
    for (const item of pattern) {
      if ("backwards" in item) {
        if (item.backwards.breakChar.length > 1) {
          breakCharCount++;
        }

        handleCheck(item.backwards.pattern);
      } else if ("repeat" in item) {
        handleCheck(item.repeat.pattern);
      }
    }

    return breakCharCount > 0;
  };

  return handleCheck(pattern);
}

export function regexFilter(value: string, regex: RegExp): string {
  return value.replace(new RegExp(`[^${regex.source}]`, "g"), "");
}
