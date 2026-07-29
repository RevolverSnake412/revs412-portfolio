---
title: "Implementing Formatted Output in C"
slug: "implementing-formatted-output-in-c"
summary: "Field notes from rebuilding a minimal printf-style function in C to understand variadic arguments, format parsing, character output, conversion handling, and low-level edge cases."
category: "Systems Programming"
tags:
  - c
  - printf
  - variadic-functions
  - stdarg
  - formatting
  - parsing
  - memory-management
  - linux
  - systems-programming
  - low-level-programming
date: "2024-01-01"
updated: "2026-07-25"
featured: true
published: true
seoTitle: "Implementing Formatted Output in C"
seoDescription: "A practical note about implementing a minimal printf-style function in C, covering variadic arguments, format parsing, conversions, output handling, return values, and edge cases."
---

## Why This Note Exists

This note documents the process of implementing a minimal `printf`-style function in C.

The value of this project is not copying the standard library. The useful part is understanding what formatted output actually does behind a simple call like:

```c
printf("Hello %s, you have %d messages\n", name, count);
```

A normal user sees text.

A `printf` implementation needs to:

```txt
read the format string
detect conversion markers
pull the correct argument type
convert values into printable characters
write the result to output
track the number of printed characters
handle errors and edge cases
```

That makes it a useful low-level C and parsing project.

## Project Context

The project was built in C as a fundamentals project focused on output formatting and variadic functions.

It belongs in the portfolio as a systems-programming note, not as a generic training assignment.

The value is in showing understanding of:

- C function interfaces
- variadic arguments
- format parsing
- conversion dispatching
- numeric conversion
- character output
- return values
- edge-case behavior
- small-library design

It complements the minimal Unix shell note because both projects deal with C, Linux behavior, and careful handling of low-level details.

## What This Project Is Meant To Prove

- simple library functions hide real parsing logic
- variadic functions require strict type discipline
- format strings are small languages
- every conversion specifier needs clear behavior
- integer output is a conversion problem, not only printing digits
- return values matter
- edge cases define whether the implementation is reliable
- C projects need careful separation between parsing, conversion, and output

## Stack and Tools Used

### Language and Runtime

- C
- GCC
- standard C library direction
- POSIX-style output direction
- Linux terminal output

### C Concepts

- `stdarg.h`
- `va_list`
- `va_start`
- `va_arg`
- `va_end`
- pointers
- strings
- integer conversion
- recursion or iterative digit output
- function pointers or dispatch tables direction
- error handling

### Formatting Concepts

- conversion specifiers
- literal characters
- percent escaping
- return count
- signed integers
- unsigned integers
- characters
- strings
- hexadecimal direction if implemented
- flags/width/precision direction if extended

## Intended Build

The intended build is a minimal `printf`-style function that can print common formatted values.

A first strong version should support:

```txt
%c  character
%s  string
%d  signed decimal integer
%i  signed decimal integer
%u  unsigned decimal integer
%%  literal percent sign
```

Possible extended conversions:

```txt
%x  lowercase hexadecimal
%X  uppercase hexadecimal
%o  octal
%p  pointer address
```

A more advanced version can support:

```txt
field width
precision
left alignment
zero padding
plus sign
space flag
hash flag
length modifiers
```

The first version should prioritize correctness over too many features.

## Basic Mental Model

A `printf`-style function is mostly a loop over the format string.

Simplified flow:

```txt
for each character in format string:
    if normal character:
        print it
        increment count

    if '%' is found:
        read next format specifier
        fetch matching argument
        convert argument to output
        increment count
```

The hard part is making this reliable when input is incomplete, invalid, or uses different argument types.

## Variadic Arguments

`printf` accepts a variable number of arguments.

That means the function cannot know argument types from the function signature alone.

A custom implementation uses `stdarg.h`.

Conceptual flow:

```c
va_list args;

va_start(args, format);
value = va_arg(args, expected_type);
va_end(args);
```

The format string tells the function which type to pull next.

This creates an important rule:

```txt
The parser and argument extraction must agree.
```

If the format says `%d`, the implementation should pull an `int`.

If the format says `%s`, it should pull a `char *`.

Pulling the wrong type causes undefined behavior.

## Format String Parsing

The format string is the instruction set.

Example:

```c
"Name: %s | Score: %d%%"
```

The parser sees:

```txt
literal text: "Name: "
specifier: %s
literal text: " | Score: "
specifier: %d
specifier: %%
```

The parser should distinguish:

- normal characters
- valid conversion specifiers
- literal percent signs
- invalid or incomplete specifiers
- optional flags/width/precision if implemented

Even a small parser needs predictable behavior.

## Conversion Dispatch

A clean implementation should avoid putting every conversion into one massive function.

A better structure:

```txt
format parser
  ↓
specifier dispatcher
  ↓
conversion handler
  ↓
output function
```

Example handlers:

```txt
print_char
print_string
print_signed_int
print_unsigned_int
print_hex
print_pointer
```

This makes the code easier to extend and debug.

## Character Output

At the lowest level, formatted output becomes character output.

A minimal implementation might write using:

```c
write(1, &c, 1);
```

or another output helper.

A helper function can track the printed count:

```txt
print one character
if success:
    count += 1
else:
    mark error
```

This is useful because `printf` returns the number of characters printed.

## Return Value

The return value matters.

Standard `printf` returns the number of characters printed, or a negative value on error.

A custom implementation should track printed characters carefully.

Example:

```c
len = _printf("Hi %s", "Ochy");
```

Expected count:

```txt
length of "Hi Ochy"
```

The count should include:

- literal characters
- converted characters
- percent signs printed by `%%`
- newlines
- spaces

It should not count characters that were not successfully written.

## String Conversion

The `%s` conversion prints a string.

Important cases:

- normal string
- empty string
- `NULL` pointer direction
- long string
- precision if implemented

A common safe behavior is to print something like:

```txt
(null)
```

when the string pointer is `NULL`, depending on the chosen requirements.

The key is to define the behavior clearly and test it.

## Character Conversion

The `%c` conversion prints a single character.

Even though it prints a `char`, variadic argument promotion means it is usually retrieved as an `int`.

Important detail:

```txt
char arguments are promoted to int in variadic functions
```

So the implementation should use:

```c
va_arg(args, int)
```

then cast or output as a character.

## Signed Integer Conversion

The `%d` and `%i` conversions print signed integers.

Important cases:

- zero
- positive numbers
- negative numbers
- minimum integer value
- large numbers
- return count

The hardest edge case is often:

```txt
INT_MIN
```

because its absolute value may not fit in a signed `int`.

A safe implementation needs to handle that without overflow.

## Unsigned Integer Conversion

The `%u` conversion prints unsigned decimal integers.

This avoids negative signs, but still needs digit extraction.

Conceptual flow:

```txt
if value is 0:
    print '0'

else:
    repeatedly divide by 10
    collect digits
    print digits in correct order
```

The implementation can use recursion, a temporary buffer, or reverse digit storage.

## Hexadecimal Conversion

If `%x` and `%X` are implemented, the function converts numbers to base 16.

Digits:

```txt
0123456789abcdef
0123456789ABCDEF
```

This teaches a general concept:

```txt
number conversion = repeated division by base
```

Decimal, octal, and hexadecimal are all variations of the same logic.

## Pointer Conversion

If `%p` is implemented, the function prints an address-like value.

Usually the output direction is:

```txt
0x...
```

This requires:

- retrieving a pointer
- casting to an integer type suitable for addresses
- converting to hexadecimal
- handling null pointer direction

Pointer formatting is a good extension but not necessary for the first version.

## Percent Escaping

The `%%` sequence prints a literal percent sign.

Example:

```c
_printf("Progress: 100%%\n");
```

Output:

```txt
Progress: 100%
```

This matters because `%` is normally the beginning of a conversion specifier.

The parser needs to recognize the special escape.

## Invalid Specifiers

A format string may contain unsupported conversions.

Example:

```c
_printf("Value: %q\n", value);
```

A minimal implementation needs a defined behavior.

Possible choices:

```txt
print '%' and the unknown specifier
ignore it
return an error
```

The important thing is consistency.

Undefined or random behavior makes debugging harder.

## Incomplete Percent At End

A common edge case:

```c
_printf("hello %");
```

The format string ends after `%`.

The implementation needs to decide what happens.

Possible behavior:

- return error
- print `%`
- ignore incomplete specifier

For a custom implementation, this should be documented and tested.

## Flags, Width, and Precision Direction

A basic implementation can skip advanced formatting.

A stronger extended version can support:

```txt
-   left align
+   force sign
0   zero padding
#   alternate form
space sign
width
precision
```

Example:

```c
printf("%08d", 42);
```

Output direction:

```txt
00000042
```

These features turn the parser from a simple specifier detector into a more serious formatting engine.

For a first version, it is better to implement fewer features correctly.

## Buffer vs Direct Write

There are two common output strategies.

### Direct Write

Print each character as soon as it is ready.

Advantages:

- simpler
- less memory management
- easy to understand

Disadvantages:

- many write calls
- harder to roll back on error

### Buffer First

Build output in memory, then write.

Advantages:

- fewer writes
- easier to manage final output
- closer to performance direction

Disadvantages:

- more memory management
- buffer resizing
- error handling complexity

A minimal version can use direct writes.

## Memory Management

A minimal `printf` may not need heavy dynamic allocation if it prints directly.

But memory may appear in:

- temporary digit buffers
- copied format data
- conversion helper buffers
- dynamic string handling
- advanced width/precision formatting

In C, every allocation needs a cleanup path.

For a small implementation, avoid unnecessary allocation where simple stack buffers or recursive output are enough.

## Testing Checklist

### Basic Output

- plain string
- empty string
- newline
- spaces
- multiple literal characters

### Character

- `%c`
- null character direction if tested
- multiple characters

### String

- `%s`
- empty string
- `NULL` string if behavior defined
- long string

### Integers

- `%d`
- `%i`
- zero
- positive number
- negative number
- `INT_MAX`
- `INT_MIN`

### Unsigned

- `%u`
- zero
- large unsigned value

### Percent

- `%%`
- percent beside text
- multiple percent signs

### Mixed Format

- `%s %d %c`
- text before and after conversions
- repeated conversions

### Invalid Cases

- unsupported specifier
- trailing `%`
- missing arguments direction
- format string is `NULL` if behavior defined

## Comparing With Standard printf

A useful test strategy is comparing output and return values against standard `printf` for supported conversions.

Example test direction:

```txt
custom output == printf output
custom return == printf return
```

Only compare features that the custom implementation claims to support.

If flags or precision are not implemented, they should not be tested as supported behavior.

## Common Bugs

### Wrong `va_arg` Type

Cause:

```txt
format parser expects one type but va_arg retrieves another
```

Result:

```txt
undefined behavior
```

Fix:

```txt
match each specifier to the correct promoted type
```

### Missing NULL Terminator Assumption

Cause:

```txt
string handler assumes every pointer is valid
```

Result:

```txt
segmentation fault
```

Fix:

```txt
define and handle NULL string behavior
```

### Incorrect Return Count

Cause:

```txt
converted characters are printed but not counted correctly
```

Fix:

```txt
centralize output/count logic
```

### INT_MIN Overflow

Cause:

```txt
trying to convert INT_MIN with normal negative-to-positive logic
```

Fix:

```txt
handle minimum value safely using wider type or unsigned logic
```

### Percent Handling Broken

Cause:

```txt
parser treats %% like invalid format
```

Fix:

```txt
special-case %% as literal percent
```

### Massive Function

Cause:

```txt
all parsing and conversion lives in one function
```

Fix:

```txt
split parser, dispatcher, and handlers
```

## Practical Decisions

### Implement fewer specifiers first

A correct `%c`, `%s`, `%d`, `%i`, `%u`, and `%%` is better than many broken conversions.

### Track count in one place

Character count bugs are easier to avoid when all output goes through one helper.

### Keep parser predictable

Unsupported specifiers should behave consistently.

### Watch variadic promotions

`char` and `short` are promoted to `int` in variadic calls.

### Test edge integers

`0`, negative values, `INT_MAX`, and `INT_MIN` reveal many bugs.

### Avoid unnecessary allocation

Simple direct output can keep the first version safer.

## What A Finished Version Should Show

A strong finished version should show:

- custom `_printf` function
- format string parser
- variadic argument handling
- conversion dispatcher
- character output helper
- printed character count
- `%c`
- `%s`
- `%d`
- `%i`
- `%u`
- `%%`
- optional `%x`, `%X`, `%o`, `%p`
- consistent error behavior
- tests against standard `printf`
- README with supported specifiers
- no memory leaks for supported paths

## Evidence Worth Capturing

Useful evidence for this note would include:

- source tree
- `_printf` function interface
- parser/dispatcher code excerpt
- integer conversion helper
- test output compared with `printf`
- edge case tests
- return value tests
- Valgrind output if available
- README supported specifier table
- examples of unsupported behavior

## Technical Assumptions

This note assumes the implementation is written in C.

It assumes the goal is to build a minimal `printf`-style function for learning and systems-programming fundamentals.

It also assumes the implementation supports a documented subset of standard `printf`, not the full standard library behavior.

## Key Risks

- pulling wrong types from `va_arg`
- returning the wrong character count
- crashing on `NULL` strings
- mishandling `INT_MIN`
- broken percent escaping
- unsupported format behavior not documented
- too many features added before the core works
- memory leaks from temporary buffers
- inconsistent output helpers
- comparing against standard `printf` for features not implemented

## Current State

This note represents a low-level C project focused on formatted output.

It is older/fundamentals-based compared with the infrastructure and business-system notes, but it still adds value because it shows:

```txt
parsing
type handling
conversion logic
output control
edge-case discipline
```

That makes it a good supporting systems-programming note.

## What This Note Does Not Claim

This note does not claim to replace the standard C library.

It does not claim to fully implement every `printf` flag, width, precision, length modifier, locale behavior, or platform-specific detail.

It documents a minimal custom implementation used to understand how formatted output works internally.

## Practical Takeaway

The useful lesson is:

> `printf` looks simple because the difficult parsing and conversion work is hidden.

To rebuild even a small version, you need to understand:

- variadic arguments
- format strings
- type-specific extraction
- number-to-text conversion
- output counting
- error handling
- edge cases
- memory discipline

Framed this way, the project becomes a C systems-programming note instead of a basic training exercise.
