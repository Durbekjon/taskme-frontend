'use client';

import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

type NativeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
>;

interface NumberFieldProps extends NativeInputProps {
  value: number;
  onValueChange: (value: number) => void;
}

/**
 * A numeric input that does not glue a leading zero to whatever you type.
 *
 * Binding `value={amount}` to a number state that starts at 0 renders "0" in
 * the box, so typing 200 produced "0200". The text being edited lives here as
 * a string - free to be empty, or mid-way through a decimal - while the parent
 * keeps receiving a number.
 */
export function NumberField({
  value,
  onValueChange,
  className,
  ...props
}: NumberFieldProps) {
  const [text, setText] = useState(() => (value === 0 ? '' : String(value)));
  // What we last told the parent, so a value it changes itself (a reset after
  // submitting, say) re-syncs the box, but our own keystrokes do not.
  const lastEmitted = useRef(value);

  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setText(value === 0 ? '' : String(value));
    }
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setText(next);
    const parsed = next === '' ? 0 : Number(next);
    if (Number.isNaN(parsed)) return;
    lastEmitted.current = parsed;
    onValueChange(parsed);
  };

  return (
    <input
      {...props}
      type="number"
      inputMode="decimal"
      value={text}
      onChange={handleChange}
      // Scrolling the page over a focused number input otherwise silently
      // changes the amount.
      onWheel={(event) => event.currentTarget.blur()}
      className={clsx('field-input', className)}
    />
  );
}
