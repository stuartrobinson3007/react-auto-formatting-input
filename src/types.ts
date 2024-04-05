export const typeDict = {
  int: {
    regex: /[0-9]+/g,
  },
  float: {
    regex: /[0-9.]+/g,
  },
  string: {
    regex: undefined,
  },
  alpha: {
    regex: /[a-zA-Z]+/g,
  },
  alphanumeric: {
    regex: /[a-zA-Z0-9]+/g,
  },
};

export type InputType = keyof typeof typeDict;

export type Pattern =
  | {
      quantity: number;
    }
  | {
      insert: string;
      before?: boolean;
    }
  | {
      repeat: {
        pattern: Pattern[];
        times: number;
      };
    }
  | {
      backwards: {
        pattern: Pattern[];
        breakChar: string;
      };
    };

export type SelectionPattern =
  | {
      valueCharCount: number;
    }
  | {
      insertCharCount: number;
    };

export type SelectionPatternWithIndexes = {
  pattern: SelectionPattern;
  start: number;
  end: number;
};
