import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { NumberField } from '@/components/ui/NumberField';

function Harness({ initial = 0 }: { initial?: number }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <NumberField value={value} onValueChange={setValue} aria-label="Amount" />
      <output data-testid="value">{value}</output>
      <button type="button" onClick={() => setValue(0)}>
        reset
      </button>
    </>
  );
}

describe('NumberField', () => {
  it('starts empty rather than showing a stray 0', () => {
    render(<Harness />);
    expect(screen.getByLabelText('Amount')).toHaveValue(null);
  });

  it('does not glue typed digits onto a leading zero', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Amount');

    await user.type(input, '200');

    // The bug: binding a number state of 0 rendered "0", so this read "0200".
    expect(input).toHaveValue(200);
    expect(screen.getByTestId('value')).toHaveTextContent('200');
  });

  it('shows an existing value when editing', () => {
    render(<Harness initial={7500} />);
    expect(screen.getByLabelText('Amount')).toHaveValue(7500);
  });

  it('treats a cleared field as zero', async () => {
    const user = userEvent.setup();
    render(<Harness initial={120} />);
    const input = screen.getByLabelText('Amount');

    await user.clear(input);

    expect(input).toHaveValue(null);
    expect(screen.getByTestId('value')).toHaveTextContent('0');
  });

  it('accepts decimals without losing the point mid-typing', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Amount');

    await user.type(input, '12.5');

    expect(screen.getByTestId('value')).toHaveTextContent('12.5');
  });

  it('clears the box when the parent resets the value', async () => {
    const user = userEvent.setup();
    render(<Harness initial={90} />);

    await user.click(screen.getByRole('button', { name: 'reset' }));

    expect(screen.getByLabelText('Amount')).toHaveValue(null);
  });
});
