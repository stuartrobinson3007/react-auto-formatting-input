export const typeDict = {
  int: {
    regex: /\d+/,
  },
  float: {
    regex: /\d+\.\d+/,
  },
  string: {
    regex: /.*/,
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
