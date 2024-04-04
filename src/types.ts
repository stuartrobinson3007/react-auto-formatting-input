export const typeDict = {
  int: {
    regex: /\d+/,
  },
  float: {
    regex: /\d+\.\d+/,
  },
  string: {
    regex: /[\s\S]*/,
  },
  alpha: {
    regex: /[a-zA-Z]+/,
  },
  alphanumeric: {
    regex: /[a-zA-Z0-9]+/,
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
