import { renderHook, act, waitFor } from '@testing-library/react-native';

import { useDebounced, useDebouncedCallback, debounce } from '@/utils/debounce';

// RNTL v14 exposes an async renderHook/rerender API.
describe('useDebounced', () => {
  it('delays value updates', async () => {
    const { result, rerender } = await renderHook(({ value }: { value: string }) => useDebounced(value, 50), {
      initialProps: { value: 'a' },
    });

    expect(result.current).toBe('a');

    await rerender({ value: 'ab' });
    expect(result.current).toBe('a'); // not yet

    await waitFor(() => expect(result.current).toBe('ab'));
  });

  it('coalesces rapid changes to the final value', async () => {
    const { result, rerender } = await renderHook(({ value }: { value: number }) => useDebounced(value, 40), {
      initialProps: { value: 0 },
    });

    await rerender({ value: 1 });
    await rerender({ value: 2 });
    await rerender({ value: 3 });

    await waitFor(() => expect(result.current).toBe(3));
  });
});

describe('useDebouncedCallback', () => {
  it('invokes the callback once after the quiet period', async () => {
    const spy = jest.fn();
    const { result } = await renderHook(() => useDebouncedCallback(spy, 40));

    await act(async () => {
      result.current('a');
      result.current('b');
      result.current('c');
    });

    expect(spy).not.toHaveBeenCalled();
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy).toHaveBeenCalledWith('c');
  });

  it('cancel prevents pending invocation', async () => {
    const spy = jest.fn();
    const { result } = await renderHook(() => useDebouncedCallback(spy, 30));

    await act(async () => {
      result.current();
      result.current.cancel();
    });

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('debounce (plain)', () => {
  it('debounces calls and supports cancel', async () => {
    const spy = jest.fn();
    const fn = debounce(spy, 30);

    fn();
    fn();
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(spy).toHaveBeenCalledTimes(1);

    fn();
    fn.cancel();
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
