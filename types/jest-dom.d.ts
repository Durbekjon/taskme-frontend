// `@testing-library/jest-dom` v7 no longer augments Jest's matchers globally
// by side effect, so `toBeInTheDocument` was not recognised by tsc.
import '@testing-library/jest-dom';
