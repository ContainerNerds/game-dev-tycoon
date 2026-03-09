export interface BugPuzzle {
  description: string;
  lines: string[];
  bugLine: number;        // 0-indexed line with the bug
  hint: string;
}

export const BUG_PUZZLES: BugPuzzle[] = [
  {
    description: 'Array index issue',
    lines: [
      'function getLastItem(arr) {',
      '  return arr[arr.length];',
      '}',
    ],
    bugLine: 1,
    hint: 'Array indices are 0-based, so the last index is length - 1',
  },
  {
    description: 'Null check missing',
    lines: [
      'function greet(user) {',
      '  return "Hello " + user.name;',
      '}',
    ],
    bugLine: 1,
    hint: 'What if user is null or undefined?',
  },
  {
    description: 'Wrong comparison operator',
    lines: [
      'function isAdmin(role) {',
      '  if (role = "admin") {',
      '    return true;',
      '  }',
      '  return false;',
      '}',
    ],
    bugLine: 1,
    hint: 'Assignment vs comparison',
  },
  {
    description: 'Infinite loop',
    lines: [
      'function countdown(n) {',
      '  while (n > 0) {',
      '    console.log(n);',
      '  }',
      '}',
    ],
    bugLine: 3,
    hint: 'The loop variable never changes',
  },
  {
    description: 'String concatenation issue',
    lines: [
      'function addPrices(a, b) {',
      '  return a + b;',
      '}',
      '// addPrices("10", "20") returns "1020"',
    ],
    bugLine: 1,
    hint: 'String + String concatenates instead of adding numbers',
  },
  {
    description: 'Off-by-one in loop',
    lines: [
      'function sum(arr) {',
      '  let total = 0;',
      '  for (let i = 0; i <= arr.length; i++) {',
      '    total += arr[i];',
      '  }',
      '  return total;',
      '}',
    ],
    bugLine: 2,
    hint: 'The loop goes one step too far',
  },
  {
    description: 'Variable scope issue',
    lines: [
      'function getCounters() {',
      '  var results = [];',
      '  for (var i = 0; i < 3; i++) {',
      '    results.push(() => i);',
      '  }',
      '  return results;',
      '}',
    ],
    bugLine: 2,
    hint: 'var is function-scoped, not block-scoped — use let',
  },
  {
    description: 'Missing return',
    lines: [
      'function double(x) {',
      '  x * 2;',
      '}',
    ],
    bugLine: 1,
    hint: 'The result is computed but never returned',
  },
  {
    description: 'Wrong logical operator',
    lines: [
      'function isValidAge(age) {',
      '  return age > 0 || age < 150;',
      '}',
    ],
    bugLine: 1,
    hint: 'OR lets any number through — should be AND',
  },
  {
    description: 'Floating point comparison',
    lines: [
      'function isEqual(a, b) {',
      '  return 0.1 + 0.2 === 0.3;',
      '}',
    ],
    bugLine: 1,
    hint: 'Floating point arithmetic is imprecise — use epsilon comparison',
  },
  {
    description: 'Wrong equality check',
    lines: [
      'function isEmpty(value) {',
      '  if (value == false) {',
      '    return true;',
      '  }',
      '  return false;',
      '}',
    ],
    bugLine: 1,
    hint: 'Loose equality treats 0, "", and null as false',
  },
  {
    description: 'Async without await',
    lines: [
      'async function fetchUser(id) {',
      '  const response = fetch("/api/user/" + id);',
      '  return response.json();',
      '}',
    ],
    bugLine: 1,
    hint: 'fetch returns a Promise that needs to be awaited',
  },
  {
    description: 'Mutation of parameter',
    lines: [
      'function addItem(list, item) {',
      '  list.push(item);',
      '  return list;',
      '}',
    ],
    bugLine: 1,
    hint: 'push() mutates the original array — should copy first',
  },
  {
    description: 'Wrong ternary logic',
    lines: [
      'function getDiscount(isMember) {',
      '  const discount = isMember ? 0 : 0.1;',
      '  return discount;',
      '}',
    ],
    bugLine: 1,
    hint: 'Members should get the discount, not non-members',
  },
  {
    description: 'Division by zero',
    lines: [
      'function average(numbers) {',
      '  const sum = numbers.reduce((a, b) => a + b, 0);',
      '  return sum / numbers.length;',
      '}',
    ],
    bugLine: 2,
    hint: 'What if the array is empty?',
  },
  {
    description: 'Type coercion trap',
    lines: [
      'function parseAge(input) {',
      '  const age = parseInt(input);',
      '  if (age) return age;',
      '  return 0;',
      '}',
      '// parseAge("0") returns 0 but via the wrong branch',
    ],
    bugLine: 2,
    hint: 'parseInt("0") returns 0 which is falsy',
  },
  {
    description: 'Missing break in switch',
    lines: [
      'function getDay(num) {',
      '  switch(num) {',
      '    case 1: return "Mon";',
      '    case 2: console.log("Tue");',
      '    case 3: return "Wed";',
      '  }',
      '}',
    ],
    bugLine: 3,
    hint: 'Case 2 falls through to case 3 without a break or return',
  },
  {
    description: 'RegExp global flag trap',
    lines: [
      'const pattern = /test/g;',
      'pattern.test("testing"); // true',
      'pattern.test("testing"); // false!',
    ],
    bugLine: 0,
    hint: 'Global regex remembers lastIndex between calls',
  },
  {
    description: 'Wrong sort comparator',
    lines: [
      'const numbers = [10, 5, 40, 25, 1];',
      'numbers.sort();',
      '// Result: [1, 10, 25, 40, 5]',
    ],
    bugLine: 1,
    hint: 'Default sort converts to strings — need a numeric comparator',
  },
  {
    description: 'Event listener leak',
    lines: [
      'function setup(element) {',
      '  element.addEventListener("click", () => {',
      '    console.log("clicked");',
      '  });',
      '}',
      '// Called every render',
    ],
    bugLine: 1,
    hint: 'Anonymous listener added on every call — never removed',
  },
];

export function getRandomPuzzle(): BugPuzzle {
  return BUG_PUZZLES[Math.floor(Math.random() * BUG_PUZZLES.length)];
}
