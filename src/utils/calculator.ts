/**
 * Safe Mathematical and Unit/Currency Calculator Engine
 * Evaluates mathematical expressions without unsafe eval() or arbitrary code execution.
 */

export interface CalculationResult {
  expression: string;
  result: string | number;
  explanation?: string;
  isConversion?: boolean;
}

// Fixed baseline exchange rates for standard conversion guidance (with disclaimer)
const CURRENCY_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  INR: 86.8,
  EUR: 0.92,
  GBP: 0.78,
  JPY: 154.5,
  CAD: 1.38,
  AUD: 1.52,
  CNY: 7.24,
  SGD: 1.34,
  AED: 3.67,
};

export function executeSafeCalculation(query: string): CalculationResult {
  const clean = query.trim();

  // Check for percentage queries like "25% of 8400" or "15 percent of 250"
  const percentMatch = clean.match(/([\d,.]+)\s*(?:%|percent)\s*(?:of)\s*([\d,.]+)/i);
  if (percentMatch) {
    const pct = parseFloat(percentMatch[1].replace(/,/g, ''));
    const val = parseFloat(percentMatch[2].replace(/,/g, ''));
    if (!isNaN(pct) && !isNaN(val)) {
      const res = (pct / 100) * val;
      return {
        expression: `${pct}% of ${val}`,
        result: res % 1 === 0 ? res : parseFloat(res.toFixed(4)),
        explanation: `(${pct} ÷ 100) × ${val} = ${res}`,
      };
    }
  }

  // Check currency conversion e.g. "convert 10 USD to INR" or "10 USD in INR"
  const currencyMatch = clean.match(/(?:convert\s+)?([\d,.]+)\s*([A-Z]{3})\s*(?:to|in|into)\s*([A-Z]{3})/i);
  if (currencyMatch) {
    const amount = parseFloat(currencyMatch[1].replace(/,/g, ''));
    const fromCurr = currencyMatch[2].toUpperCase();
    const toCurr = currencyMatch[3].toUpperCase();

    if (CURRENCY_RATES_TO_USD[fromCurr] && CURRENCY_RATES_TO_USD[toCurr]) {
      // Amount in USD
      const inUSD = amount / CURRENCY_RATES_TO_USD[fromCurr];
      const converted = inUSD * CURRENCY_RATES_TO_USD[toCurr];
      const formatted = converted.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
      return {
        expression: `${amount} ${fromCurr} → ${toCurr}`,
        result: `${formatted} ${toCurr}`,
        explanation: `Approximate rate based on reference benchmark: 1 ${fromCurr} ≈ ${(CURRENCY_RATES_TO_USD[toCurr] / CURRENCY_RATES_TO_USD[fromCurr]).toFixed(4)} ${toCurr}. Note: Live market rates vary.`,
        isConversion: true,
      };
    }
  }

  // Check unit conversion e.g. "5 km to miles", "100 kg to lbs", "75 f to c", "10 miles to km"
  const unitMatch = clean.match(/(?:convert\s+)?([\d,.]+)\s*(km|miles|mile|mi|meters|m|feet|ft|inches|inch|in|kg|lbs|pounds|celsius|fahrenheit|c|f)\s*(?:to|in|into)\s*(km|miles|mile|mi|meters|m|feet|ft|inches|inch|in|kg|lbs|pounds|celsius|fahrenheit|c|f)/i);
  if (unitMatch) {
    const val = parseFloat(unitMatch[1].replace(/,/g, ''));
    const fromUnit = unitMatch[2].toLowerCase();
    const toUnit = unitMatch[3].toLowerCase();

    // Distance
    if ((fromUnit === 'km') && (toUnit === 'miles' || toUnit === 'mile' || toUnit === 'mi')) {
      const res = val * 0.621371;
      return { expression: `${val} km → miles`, result: `${res.toFixed(4)} miles`, explanation: `1 km = 0.621371 miles` };
    }
    if ((fromUnit === 'miles' || fromUnit === 'mile' || fromUnit === 'mi') && (toUnit === 'km')) {
      const res = val * 1.60934;
      return { expression: `${val} miles → km`, result: `${res.toFixed(4)} km`, explanation: `1 mile = 1.60934 km` };
    }
    // Temperature
    if ((fromUnit === 'f' || fromUnit === 'fahrenheit') && (toUnit === 'c' || toUnit === 'celsius')) {
      const res = ((val - 32) * 5) / 9;
      return { expression: `${val}°F → °C`, result: `${res.toFixed(2)}°C`, explanation: `(${val} - 32) × 5/9 = ${res.toFixed(2)}` };
    }
    if ((fromUnit === 'c' || fromUnit === 'celsius') && (toUnit === 'f' || toUnit === 'fahrenheit')) {
      const res = (val * 9) / 5 + 32;
      return { expression: `${val}°C → °F`, result: `${res.toFixed(2)}°F`, explanation: `(${val} × 9/5) + 32 = ${res.toFixed(2)}` };
    }
    // Weight
    if ((fromUnit === 'kg') && (toUnit === 'lbs' || toUnit === 'pounds')) {
      const res = val * 2.20462;
      return { expression: `${val} kg → lbs`, result: `${res.toFixed(4)} lbs`, explanation: `1 kg = 2.20462 lbs` };
    }
    if ((fromUnit === 'lbs' || fromUnit === 'pounds') && (toUnit === 'kg')) {
      const res = val * 0.453592;
      return { expression: `${val} lbs → kg`, result: `${res.toFixed(4)} kg`, explanation: `1 lb = 0.453592 kg` };
    }
  }

  // Pure arithmetic evaluator with Tokenizer and Recursive Descent (Safe AST parser)
  try {
    const mathResult = parseAndEvaluateMath(clean);
    return {
      expression: clean,
      result: mathResult,
    };
  } catch (err: any) {
    return {
      expression: clean,
      result: 'Error',
      explanation: err.message || 'Could not parse calculation expression',
    };
  }
}

/**
 * Safe Arithmetic Parser & Evaluator (No eval)
 * Supports +, -, *, /, %, ^ (power), parentheses, sqrt(), abs(), round(), floor(), ceil(), log(), sin(), cos(), tan()
 */
function parseAndEvaluateMath(expr: string): number {
  // Normalize math symbols
  let sanitized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '')
    .replace(/pi/gi, String(Math.PI))
    .replace(/e\b/gi, String(Math.E));

  // Only allow valid characters
  if (!/^[0-9+\-*/().^%\s\w]+$/.test(sanitized)) {
    throw new Error('Expression contains invalid characters');
  }

  const tokens = tokenize(sanitized);
  let pos = 0;

  function peek(): string | null {
    return pos < tokens.length ? tokens[pos] : null;
  }

  function consume(): string {
    return tokens[pos++];
  }

  function parseExpression(): number {
    let result = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const nextTerm = parseTerm();
      if (op === '+') result += nextTerm;
      else result -= nextTerm;
    }
    return result;
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = consume();
      const nextFactor = parseFactor();
      if (op === '*') result *= nextFactor;
      else if (op === '/') {
        if (nextFactor === 0) throw new Error('Division by zero');
        result /= nextFactor;
      } else if (op === '%') {
        result %= nextFactor;
      }
    }
    return result;
  }

  function parseFactor(): number {
    let result = parsePower();
    return result;
  }

  function parsePower(): number {
    let base = parsePrimary();
    if (peek() === '^') {
      consume();
      const exponent = parsePower(); // right associative
      return Math.pow(base, exponent);
    }
    return base;
  }

  function parsePrimary(): number {
    const token = peek();
    if (!token) throw new Error('Unexpected end of expression');

    // Unary minus
    if (token === '-') {
      consume();
      return -parsePrimary();
    }
    if (token === '+') {
      consume();
      return parsePrimary();
    }

    // Parentheses
    if (token === '(') {
      consume();
      const val = parseExpression();
      if (peek() !== ')') throw new Error("Missing closing parenthesis ')'");
      consume();
      return val;
    }

    // Function calls
    if (['sqrt', 'abs', 'round', 'floor', 'ceil', 'log', 'sin', 'cos', 'tan'].includes(token.toLowerCase())) {
      const fn = consume().toLowerCase();
      if (peek() !== '(') throw new Error(`Function ${fn} must be followed by '('`);
      consume();
      const arg = parseExpression();
      if (peek() !== ')') throw new Error(`Missing closing parenthesis after ${fn}`);
      consume();

      switch (fn) {
        case 'sqrt': return Math.sqrt(arg);
        case 'abs': return Math.abs(arg);
        case 'round': return Math.round(arg);
        case 'floor': return Math.floor(arg);
        case 'ceil': return Math.ceil(arg);
        case 'log': return Math.log10(arg);
        case 'sin': return Math.sin((arg * Math.PI) / 180);
        case 'cos': return Math.cos((arg * Math.PI) / 180);
        case 'tan': return Math.tan((arg * Math.PI) / 180);
      }
    }

    // Numeric literal
    if (/^[\d.]+$/.test(token)) {
      consume();
      const num = parseFloat(token);
      if (isNaN(num)) throw new Error(`Invalid number: ${token}`);
      return num;
    }

    throw new Error(`Unexpected token: ${token}`);
  }

  const result = parseExpression();
  if (pos < tokens.length) {
    throw new Error(`Unexpected trailing content: ${tokens.slice(pos).join(' ')}`);
  }

  return Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (['+', '-', '*', '/', '%', '^', '(', ')'].includes(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }

    // Numbers
    if (/[\d.]/.test(ch)) {
      let numStr = '';
      while (i < input.length && /[\d.]/.test(input[i])) {
        numStr += input[i];
        i++;
      }
      tokens.push(numStr);
      continue;
    }

    // Words / Functions
    if (/[a-zA-Z]/.test(ch)) {
      let word = '';
      while (i < input.length && /[a-zA-Z0-9]/.test(input[i])) {
        word += input[i];
        i++;
      }
      tokens.push(word);
      continue;
    }

    i++;
  }
  return tokens;
}
