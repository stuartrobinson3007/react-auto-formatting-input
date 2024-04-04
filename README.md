<div align="center">
  <img src="https://badgen.net/npm/v/react-auto-formatting-input" alt="NPM Version" />
  <img src="https://badgen.net/bundlephobia/minzip/react-auto-formatting-input" alt="minzipped size"/>
  <img src="https://github.com/stuartrobinson3007/react-auto-formatting-input/workflows/CI/badge.svg" alt="Build Status" />
</a>
</div>
<br />
<div align="center"><strong>Input with auto-formatting</strong></div>
<div align="center">For phone numbers, currencies, credit cards and more...</div>

<br />
<div align="center">
  <sub>By <a href="https://twitter.com/sturobinson">Stuart Robinson</a></sub>
</div>

<br />

## Demo

Check out a demo here: <a href="https://react-auto-formatting-input.vercel.app/" target="_blank">Demo</a>

## Installation

#### With NPM

```sh
npm install react-auto-formatting-input
```

<br />

## Getting Started

```jsx
import AutoFormattingInput, {
  InputType,
  PhonePattern,
} from 'react-auto-formatting-input';

const App = () => {
  const [value, setValue] = useState('');

  return (
    <AutoFormattingInput
      value={value}
      onValueChange={setValue}
      pattern={PhonePattern}
      type={'int'}
    />
  );
};
```

<br />

## Documentation

The `AutoFormattingInput` component accepts a pattern prop, which defines the formatting rules for the input field. This pattern prop allows you to customize how the input value is displayed to the user.

### Type / Regex

### Predefined Patterns

The package provides several predefined patterns for common formatting tasks. These patterns can be imported and used directly in your application without the need for custom configuration.

#### Phone Number Pattern

- (XXX) XXX-XXXX

#### Credit Card Number Pattern

- XXXX XXXX XXXX XXXX

#### Date Pattern

- MM / DD / YYYY

#### Currency Pattern

- X,XXX,XXX.XX

#### Zip Code Pattern

- XXXXX - XXXX

### Custom Patterns

A pattern is defined using an array of objects, where each object represents a formatting instruction. There are four types of formatting instructions:

1. **Quantity**: Specifies the number of characters to include in the input field.

   - Key: `quantity`
   - Value: Number representing the quantity of characters.

2. **Insert**: Inserts a specific string into the input field.

   - Key: `insert`
   - Value: String to be inserted.
   - Optional Key: `before`
     - Value: Boolean indicating whether to insert the string before or after the current cursor position.

3. **Repeat**: Repeats a sequence of patterns a specified number of times.

   - Key: `repeat`
   - Value: Object with two keys:
     - `pattern`: An array of pattern objects to be repeated.
     - `times`: Number indicating how many times to repeat the sequence or -1 for infinite.

4. **Backwards**: Formats the input in reverse order, breaking it at a specified character.
   - Key: `backwards`
   - Value: Object with two keys:
     - `pattern`: An array of pattern objects that will be applied to a reversed input value.
     - `breakChar`: Character at which to break the string.

### Example Patterns

#### Zip Code Pattern

This pattern formats a zip code by inserting a hyphen after the first five characters.

```jsx
const ZipCodePattern = [
  {
    quantity: 5,
  },
  {
    insert: ' - ',
    before: true,
  },
  {
    quantity: 4,
  },
];
```

#### Currency Pattern

This pattern formats currency by inserting commas every three digits from the right, with a period as the decimal separator.

```jsx
const CurrencyPattern = [
  {
    backwards: {
      pattern: [
        {
          repeat: {
            // Repeat the xxx,xxx,xxx,xxx, pattern to add commas
            pattern: [
              {
                quantity: 3,
              },
              {
                insert: ',',
              },
            ],
            times: -1, // Repeat infinitely
          },
        },
      ],
      breakChar: '.', // Stop the pattern when the user types a period
    },
  },
  {
    quantity: 2, // Two more characters which are the decimal numbers after the period breakChar
  },
];
```
