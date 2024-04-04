import React, {
  forwardRef,
  ForwardedRef,
  useRef,
  InputHTMLAttributes,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from 'react';

import {
  checkForNestedBackwardsPattern,
  checkForMultiCharacterBreakChars,
  getSelectionWithoutFormatting,
  assignIndexesToPattern,
  getIndexWithFormatting,
  findNextNonInsertPattern,
  regexFilter,
  format,
} from './lib';
import { Pattern, InputType, SelectionPattern } from './types';

interface AutoFormattingInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'pattern'> {
  pattern: Pattern[];
  type: InputType;
  value: string;
  onValueChange: (value: string) => void;
  hiddenInputProps?: InputHTMLAttributes<HTMLInputElement>;
  includeHiddenInput?: boolean;
}

const AutoFormattingInput = forwardRef<
  HTMLInputElement,
  AutoFormattingInputProps
>(
  (
    {
      pattern,
      type,
      value: userValue,
      onValueChange,
      hiddenInputProps,
      ...props
    },
    ref: ForwardedRef<HTMLInputElement>
  ) => {
    if (checkForNestedBackwardsPattern(pattern)) {
      throw new Error(
        'Backwards patterns within backwards patterns are not supported. Please check your pattern.'
      );
    }

    if (checkForMultiCharacterBreakChars(pattern)) {
      throw new Error(
        'breakChars must be a single character. Please check your pattern.'
      );
    }

    const [value, setValue] = useState('');
    const [formattedValue, setFormattedValue] = useState('');

    const inputRef = useRef<HTMLInputElement>(null);

    // If a ref is provided by the parent, use it; otherwise, use the internally generated ref
    const forwardedRef = ref || inputRef;

    const testRef = useRef<HTMLInputElement>(null);

    // The selectionRef is used to store the selection start and end indexes of the user's selection in the formatted input
    const selectionRef = useRef<{
      start: number;
      end: number;
    } | null>({
      start: 0,
      end: 0,
    });

    // The selectionPattern is used to convert the user's selection in the formatted input back into the selection without the inserted characters
    const selectionPattern = useRef<SelectionPattern[]>([]);

    const handleInput = (
      text: string,
      deleteForward = false,
      deleteBackward = false
    ) => {
      if (!selectionRef.current) return;

      const selection = selectionRef.current;

      // Convert the selection start and end to what it would be in the hidden input (without the inserted characters)
      const { start, end } = getSelectionWithoutFormatting(
        selection,
        selectionPattern.current
      );

      let newValue = value;
      let newIndexWithoutFormatting = start;

      // If the user is deleting, cut out the characters from the value
      if (deleteForward || deleteBackward) {
        if (start !== end) {
          newValue = value.slice(0, start) + value.slice(end);

          // If the user is deleting forward, the selection should stay at the same index
          newIndexWithoutFormatting = start;
        } else {
          if (deleteForward) {
            newValue = value.slice(0, start) + value.slice(start + 1);

            // If the user is deleting forward, the selection should stay at the same index
            newIndexWithoutFormatting = start;
          } else {
            newValue = value.slice(0, start - 1) + value.slice(start);

            // If the user is deleting backward, the selection should move back one index
            newIndexWithoutFormatting = start - 1;
          }
        }
      } else {
        // Replace the characters with the new characters passed in from "text"
        newValue = value.slice(0, start) + text + value.slice(end);

        // Set the selection to the end of the inserted characters
        newIndexWithoutFormatting = start + text.length;
      }

      // Format the new value with the pattern
      newValue = regexFilter(newValue, /\d+\.\d+/);

      const formatResult = format(newValue, pattern);
      setFormattedValue(formatResult.formattedValue);
      setValue(formatResult.newValue);
      onValueChange(formatResult.newValue);

      selectionPattern.current = formatResult.selectPattern;

      // setTimeout(() => {
      //   const selectionPatternWithIndexes = assignIndexesToPattern(
      //     formatResult.selectPattern
      //   );

      //   const newSelection = getIndexWithFormatting(
      //     newIndexWithoutFormatting,
      //     selectionPatternWithIndexes
      //   );
      //   testRef.current?.setSelectionRange(newSelection, newSelection);
      // }, 0);

      requestAnimationFrame(() => {
        const selectionPatternWithIndexes = assignIndexesToPattern(
          formatResult.selectPattern
        );

        const newSelection = getIndexWithFormatting(
          newIndexWithoutFormatting,
          selectionPatternWithIndexes
        );
        testRef.current?.setSelectionRange(newSelection, newSelection);
      });
    };

    const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      const inputEvent = e.nativeEvent as InputEvent;

      const isDelete = newValue.length < value.length;

      const isDeleteForward = inputEvent.inputType === 'deleteContentForward';
      const isDeleteBackward = inputEvent.inputType === 'deleteContentBackward';

      // If we can't get the data from the input event (for example on an autofill event), use the value from the input element.
      // For all practical cases, the newValue will be completely overwriting the previous value so it will be fine to use the whole newValue as the new characters
      const newCharacters = inputEvent.data ?? (isDelete ? '' : newValue);

      handleInput(newCharacters, isDeleteForward, isDeleteBackward);
    };

    const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const paste = e.clipboardData.getData('text');
      handleInput(paste);
    };

    const onSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      let { selectionStart, selectionEnd } = target;

      if (selectionStart === null || selectionEnd === null) return;

      // If the selection has 0 length and it's within any insert characters, move the selection to the next non-insert character

      if (selectionStart === selectionEnd) {
        // Decide if the selection is moving forward or backward
        const direction =
          (selectionRef.current?.start ?? 0) > selectionStart
            ? 'backward'
            : 'forward';

        // Get the selection pattern with indexes
        const selectionPatternWithIndexes = assignIndexesToPattern(
          selectionPattern.current
        );

        // Check if the selection is within any insert characters
        const selectionPatternIndex = selectionPatternWithIndexes.findIndex(
          (item) => {
            if (selectionStart === null || selectionEnd === null) return -1;
            return item.start <= selectionStart && item.end >= selectionStart;
          }
        );

        if (
          selectionPatternIndex !== -1 &&
          'insertCharCount' in
            selectionPatternWithIndexes[selectionPatternIndex].pattern
        ) {
          // Find the next non-insert pattern
          const nextNonInsertPattern = findNextNonInsertPattern(
            selectionPatternWithIndexes,
            selectionPatternIndex,
            direction
          );

          // Get the index with formatting
          const newIndex = nextNonInsertPattern
            ? direction === 'forward'
              ? nextNonInsertPattern.start
              : nextNonInsertPattern.end
            : selectionStart;

          // Set the selection to the new index
          target.setSelectionRange(newIndex, newIndex);

          selectionStart = newIndex;
          selectionEnd = newIndex;
        }
      }

      selectionRef.current =
        selectionStart !== null && selectionEnd !== null
          ? {
              start: selectionStart,
              end: selectionEnd,
            }
          : null;
    };

    const onBlur = () => {
      selectionRef.current = null;
    };

    return (
      <>
        <input
          ref={testRef}
          type="text"
          {...props}
          value={formattedValue}
          onInput={onInput}
          onSelect={onSelect}
          onBlur={onBlur}
          onPaste={onPaste}
        />
      </>
    );
  }
);

AutoFormattingInput.displayName = 'AutoFormattingInput';

export default AutoFormattingInput;
