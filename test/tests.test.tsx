import { render, screen } from '@testing-library/react';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import AutoFormattingInput from '../src/AutoFormattingInput';
import { regexFilter, assignIndexesToPattern } from '../src/lib';
import { CurrencyPattern } from '../src';
import { typeDict } from '../src/types';

describe('regexFilter', () => {
  it('Filters letters from 1a2b3c', () => {
    const regex = typeDict['int'].regex;

    const input = '1a2b3c';
    const expectedOutput = '123';

    const result = regexFilter(input, regex);

    expect(result).toBe(expectedOutput);
  });

  it('Filters symbols from 1!@2#$3a%^', () => {
    const regex = typeDict['alphanumeric'].regex;

    const input = '1!@2#$3a%^';
    const expectedOutput = '123a';

    const result = regexFilter(input, regex);

    expect(result).toBe(expectedOutput);
  });

  it('Filters symbols and numbers from 1!@2#$3a%^', () => {
    const regex = typeDict['alpha'].regex;

    const input = '1!@2#$3a%^';
    const expectedOutput = 'a';

    const result = regexFilter(input, regex);

    expect(result).toBe(expectedOutput);
  });

  it('Filters nothing from 1!@2#$3a%^', () => {
    const regex = typeDict['string'].regex;

    const input = '1!@2#$3a%^';
    const expectedOutput = '1!@2#$3a%^';

    const result = regexFilter(input, regex);

    expect(result).toBe(expectedOutput);
  });

  it('Filters letters from float', () => {
    const regex = typeDict['float'].regex;

    const input = '123a.234';
    const expectedOutput = '123.234';

    const result = regexFilter(input, regex);

    expect(result).toBe(expectedOutput);
  });
});

describe('assignIndexesToPattern', () => {
  it('Assigns indexes to a simple pattern', () => {
    const selectionPattern = [
      { valueCharCount: 2 },
      { insertCharCount: 3 },
      { valueCharCount: 2 },
    ];

    const expectedOutput = [
      {
        pattern: { valueCharCount: 2 },
        start: 0,
        end: 2,
      },
      {
        pattern: { insertCharCount: 3 },
        start: 2,
        end: 5,
      },
      {
        pattern: { valueCharCount: 2 },
        start: 5,
        end: 7,
      },
    ];

    const result = assignIndexesToPattern(selectionPattern);

    expect(result).toEqual(expectedOutput);
  });
});

describe('Basic pattern', () => {
  const pattern = [
    { quantity: 2 },
    { insert: ' / ', before: true },
    { quantity: 2 },
  ];

  const TestComponent = ({ ...props }) => {
    const [value, setValue] = useState('');

    return (
      <AutoFormattingInput
        pattern={pattern}
        value={value}
        type="int"
        onValueChange={setValue}
        {...props}
      />
    );
  };

  it('Displays empty input', () => {
    render(<TestComponent data-testid="test-component" />);

    // get the input element
    const inputElement = screen.getByTestId(
      'test-component'
    ) as HTMLInputElement;

    // check if the input element is empty
    expect(inputElement.value).toBe('');
  });

  it('Typing a letter does not change the input value', async () => {
    render(<TestComponent data-testid="test-component" />);

    // get the input element
    const inputElement = screen.getByTestId(
      'test-component'
    ) as HTMLInputElement;

    // Simulate typing a letter ('a' for example)
    await userEvent.type(inputElement, 'a');

    // Check if the input value has changed to 'a'
    expect(inputElement.value).toBe('');
  });

  it('Typing one number inserts only that number', async () => {
    render(<TestComponent data-testid="test-component" />);

    // get the input element
    const inputElement = screen.getByTestId(
      'test-component'
    ) as HTMLInputElement;

    // Simulate typing one number ('1')
    await userEvent.type(inputElement, '1');

    // Check if the input value has changed to '1'
    expect(inputElement.value).toBe('1');
  });

  it("Typing two numbers inserts ' / ' with the cursor after", async () => {
    render(<TestComponent data-testid="test-component" />);

    // get the input element
    const inputElement = screen.getByTestId(
      'test-component'
    ) as HTMLInputElement;

    // Simulate typing two numbers ('1' and '2')
    await userEvent.type(inputElement, '12');

    // Check if the input value has changed to '12 / '
    expect(inputElement.value).toBe('12 / ');
  });

  it('Changing value to four numbers results clips the input value to 4 characters with the cursor at the end', async () => {
    render(<TestComponent data-testid="test-component" />);

    // get the input element
    const inputElement = screen.getByTestId(
      'test-component'
    ) as HTMLInputElement;

    // Change the input value to four numbers ('1', '2', '3', and '4')
    await userEvent.type(inputElement, '1234');

    // Check if the input value has changed to '12 / 34'
    expect(inputElement.value).toBe('12 / 34');
  });

  it('Change value to five numbers results clips the input value to 4 characters with the cursor at the end', async () => {
    render(<TestComponent data-testid="test-component" />);

    // get the input element
    const inputElement = screen.getByTestId(
      'test-component'
    ) as HTMLInputElement;

    //  Change the input value to five numbers ('1', '2', '3', '4', and '5')
    await userEvent.type(inputElement, '12345');

    // Check if the input value has changed to '12 / 34'
    expect(inputElement.value).toBe('12 / 34');
  });

  it("Typing two numbers inserts ' / ', then keyboard 'left' sets the cursor position to before the ' / '", async () => {
    const user = userEvent.setup();

    render(<TestComponent data-testid="test-component" />);

    // get the input element
    const inputElement = screen.getByTestId(
      'test-component'
    ) as HTMLInputElement;

    // Click the input to focus it
    await user.click(inputElement);

    // Type '1'
    await user.keyboard('12');

    expect(inputElement.value).toBe('12 / ');

    // Check if the cursor is after the ' / '
    expect(inputElement.selectionStart).toBe(5);

    // Simulate pressing the 'left' key
    await user.keyboard('{arrowleft}');

    // Check if the cursor is before the ' / '
    expect(inputElement.selectionStart).toBe(2);
  });

  it("Typing two numbers, then keyboard 'left', then another number results in '12 / 3' with the cursor after the 2", async () => {
    const user = userEvent.setup();

    render(<TestComponent data-testid="test-component" />);

    // get the input element
    const inputElement = screen.getByTestId(
      'test-component'
    ) as HTMLInputElement;

    // Simulate typing '12'
    await user.type(inputElement, '12');

    // Check if the input value is '12 / '
    expect(inputElement.value).toBe('12 / ');

    // Check if the cursor is after the ' / '
    expect(inputElement.selectionStart).toBe(5);

    // Simulate pressing the 'left' key
    await user.keyboard('{arrowleft}');

    // Check if the cursor is before the ' / '
    expect(inputElement.selectionStart).toBe(2);

    // Simulate typing '3'
    await user.type(inputElement, '3');

    // Check if the input value is '12 / 3'
    expect(inputElement.value).toBe('12 / 3');
  });

  it("Typing two numbers inserts the ' / ', then backspace removes it and the second number", async () => {
    const user = userEvent.setup();

    render(<TestComponent data-testid="test-component" />);

    // get the input element
    const inputElement = screen.getByTestId(
      'test-component'
    ) as HTMLInputElement;

    // Simulate typing '12'
    await user.type(inputElement, '12');

    // Check if the input value is '12 / '
    expect(inputElement.value).toBe('12 / ');

    // Check if the cursor is after the ' / '
    expect(inputElement.selectionStart).toBe(5);

    // Simulate pressing the 'backspace' key
    await user.keyboard('{backspace}');

    // Check if the input value is '1'
    expect(inputElement.value).toBe('1');
  });

  it("Typing three numbers inserts the ' / ', then backspace removes the last number, backspace again removes the ' / ' and second number", async () => {
    const user = userEvent.setup();

    render(<TestComponent data-testid="test-component" />);

    // get the input element
    const inputElement = screen.getByTestId(
      'test-component'
    ) as HTMLInputElement;

    // Simulate typing '123'
    await user.type(inputElement, '123');

    // Check if the input value is '12 / 3'
    expect(inputElement.value).toBe('12 / 3');

    // Simulate pressing the 'backspace' key
    await user.keyboard('{backspace}');

    // Check if the input value is '12 / '
    expect(inputElement.value).toBe('12 / ');

    // Check if the cursor is after the ' / '
    expect(inputElement.selectionStart).toBe(5);

    // Simulate pressing the 'backspace' key
    await user.keyboard('{backspace}');

    // Check if the input value is '1'
    expect(inputElement.value).toBe('1');
  });

  it("Typing four numbers, then clicking to put the cursor before the ' / ' then backspace results in '13 / 4' with the cursor after the 1", async () => {
    const user = userEvent.setup();

    render(<TestComponent data-testid="test-component" />);

    // get the input element
    const inputElement = screen.getByTestId(
      'test-component'
    ) as HTMLInputElement;

    // Simulate typing '1234'
    await user.type(inputElement, '1234');

    // Check if the input value is '12 / 34'
    expect(inputElement.value).toBe('12 / 34');

    // Put the cursor before the ' / '
    await user.pointer({
      target: inputElement,
      node: inputElement,
      offset: 2,
      keys: '[MouseLeft]',
    });

    // Check if the cursor is before the ' / '
    expect(inputElement.selectionStart).toBe(2);

    // Simulate pressing the 'backspace' key
    await user.keyboard('{backspace}');

    // Check if the input value is '13 / 4'
    expect(inputElement.value).toBe('13 / 4');

    // Check if the cursor is after the '1'
    expect(inputElement.selectionStart).toBe(1);
  });
});

describe('Currency', () => {
  const TestComponent = ({ ...props }) => {
    const [value, setValue] = useState('');

    return (
      <AutoFormattingInput
        pattern={CurrencyPattern}
        value={value}
        type="float"
        onValueChange={setValue}
        {...props}
      />
    );
  };

  it('Displays formatted number', async () => {
    render(<TestComponent data-testid="test-component" />);

    // get the input element
    const inputElement = screen.getByTestId(
      'test-component'
    ) as HTMLInputElement;

    // Check if the input value is empty
    expect(inputElement.value).toBe('');

    // Type '12345678'
    await userEvent.type(inputElement, '12345678');

    // Check if the input value is '12,345,678'
    expect(inputElement.value).toBe('12,345,678');

    // Type .90
    await userEvent.type(inputElement, '.90');

    // Check if the input value is '12,345,678.90'
    expect(inputElement.value).toBe('12,345,678.90');
  });
});
