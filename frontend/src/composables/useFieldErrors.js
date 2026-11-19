import { reactive } from 'vue'

/**
 * Blur-first field errors: show on blur, clear on edit, re-check on submit.
 * Returns a reactive `errors` map plus helpers for templates.
 */
export function useFieldErrors() {
  const errors = reactive({})

  function setError(field, message) {
    if (message) errors[field] = message
    else delete errors[field]
  }

  function clearError(field) {
    delete errors[field]
  }

  function clearAll() {
    Object.keys(errors).forEach((k) => delete errors[k])
  }

  function hasErrors(fields) {
    return fields.some((f) => !!errors[f])
  }

  function required(field, value, message = 'Enter a value to continue.') {
    const ok = typeof value === 'string' ? value.trim().length > 0 : value != null && value !== ''
    setError(field, ok ? '' : message)
    return ok
  }

  function onInput(field) {
    if (errors[field]) clearError(field)
  }

  return { errors, setError, clearError, clearAll, hasErrors, required, onInput }
}
