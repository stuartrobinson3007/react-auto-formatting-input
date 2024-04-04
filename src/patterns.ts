const PhonePattern = [
  {
    insert: '( ',
  },
  {
    quantity: 2,
  },
  {
    insert: ' ) ',
    before: true,
  },
  {
    quantity: 3,
  },
  {
    insert: ' - ',
    before: true,
  },
  {
    quantity: 4,
  },
];

const CreditCardPattern = [
  {
    quantity: 4,
  },
  {
    insert: ' ',
    before: true,
  },
  {
    quantity: 4,
  },
  {
    insert: ' ',
    before: true,
  },
  {
    quantity: 4,
  },
  {
    insert: ' ',
    before: true,
  },
  {
    quantity: 4,
  },
];

const DatePattern = [
  {
    quantity: 2,
  },
  {
    insert: ' / ',
    before: true,
  },
  {
    quantity: 2,
  },
  {
    insert: ' / ',
    before: true,
  },
  {
    quantity: 4,
  },
];

const CurrencyPattern = [
  {
    backwards: {
      pattern: [
        {
          repeat: {
            pattern: [
              {
                quantity: 3,
              },
              {
                insert: ',',
              },
            ],
            times: -1,
          },
        },
      ],
      breakChar: '.',
    },
  },
  {
    quantity: 2,
  },
];

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

export {
  PhonePattern,
  CreditCardPattern,
  DatePattern,
  CurrencyPattern,
  ZipCodePattern,
};
