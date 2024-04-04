'use client';

import { useState } from 'react';
import AutoFormattingInput, {
  InputType,
  Pattern,
  PhonePattern,
  CreditCardPattern,
  CurrencyPattern,
  DatePattern,
  ZipCodePattern,
} from 'react-auto-formatting-input';

const customPattern = [
  {
    quantity: 3,
  },
  {
    insert: ' # ',
  },
  {
    quantity: 3,
  },
  {
    insert: ' // ',
  },
  {
    quantity: 4,
  },
];

type InputProps = Omit<
  React.ComponentProps<'input'>,
  'value' | 'pattern' | 'type'
>;

const Block = ({
  title,
  example,
  type,
  pattern,
  inputProps,
  showPatterns,
}: {
  title: string;
  example: string;
  type: InputType;
  pattern: Pattern[];
  inputProps?: InputProps;
  showPatterns: boolean;
}) => {
  const [value, setValue] = useState('');
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 w-full">
      <label className="font-bold" htmlFor="title">
        {title}
      </label>
      <p className="text-zinc-400 text-xs mt-1">{example}</p>
      <AutoFormattingInput
        value={value}
        onValueChange={setValue}
        pattern={pattern}
        type={type}
        name="title"
        className="border border-zinc-200 rounded p-2 w-full mt-3"
        {...inputProps}
      />
      {showPatterns && (
        <pre className="text-zinc-500 text-xs mt-4 p-6 bg-zinc-50 rounded">
          {JSON.stringify(pattern, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default function Home() {
  const [showPatterns, setShowPatterns] = useState(false);

  return (
    <div className="container max-w-2xl mx-auto p-4 my-20 md:text-sm text-zinc-900">
      <h1 className="text-4xl font-bold mb-6">Auto Formatting Input</h1>

      <label className="flex items-center mb-4">
        <input
          type="checkbox"
          checked={showPatterns}
          onChange={() => setShowPatterns(!showPatterns)}
          className="mr-2"
        />
        Show patterns
      </label>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        <Block
          title="Phone Number"
          example="( 12 ) 345 - 6789"
          pattern={PhonePattern}
          type="int"
          showPatterns={showPatterns}
        />
        <Block
          title="Credit Card"
          example="4242 4242 4242 4242"
          pattern={CreditCardPattern}
          type="int"
          showPatterns={showPatterns}
        />
        <Block
          title="Date"
          example="29 / 07 / 1954"
          pattern={DatePattern}
          type="int"
          showPatterns={showPatterns}
        />
        <Block
          title="Currency"
          example="12,345,678.90"
          pattern={CurrencyPattern}
          type="float"
          showPatterns={showPatterns}
          inputProps={{
            onBlur: (e) => {
              console.log('onBlur', e.target.value);
            },
          }}
        />
        <Block
          title="USA Zip Code"
          example="12345 - 6789"
          pattern={ZipCodePattern}
          type="int"
          showPatterns={showPatterns}
        />
        <Block
          title="Custom Pattern"
          example="AB1 # XY2 // 1234"
          pattern={customPattern}
          type="string"
          showPatterns={showPatterns}
        />
      </div>
    </div>
  );
}
