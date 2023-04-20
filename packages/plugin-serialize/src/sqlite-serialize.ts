export type Serializer = (parameter: unknown) => unknown
export type Deserializer = (parameter: unknown, autoConvert?: boolean) => unknown
export const defaultSerializer: Serializer = (parameter) => {
  if (parameter === undefined
    || parameter === null
    || typeof parameter === 'bigint'
    || typeof parameter === 'number'
    || (typeof parameter === 'object' && 'buffer' in parameter)
    || parameter instanceof Uint8Array
    || parameter instanceof Uint16Array
    || parameter instanceof Uint32Array
  ) {
    return parameter
  } else if (typeof parameter === 'boolean') {
    return `${parameter}`
  } else {
    return JSON.stringify(parameter)
  }
}
export const defaultDeserializer: Deserializer = (parameter) => {
  if (parameter === undefined
    || parameter === null
    || typeof parameter === 'bigint'
    || typeof parameter === 'number'
    || parameter instanceof Uint8Array
    || parameter instanceof Uint16Array
    || parameter instanceof Uint32Array
  ) {
    return parameter
  }
  if (typeof parameter === 'object' && 'buffer' in parameter) {
    return Uint8Array.from(parameter as any)
  }
  if (typeof parameter === 'string') {
    if (/^(true|false)$/.test(parameter)) {
      return parameter === 'true'
    } else if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/.test(parameter)) {
      return new Date(parameter)
    } else {
      try {
        return JSON.parse(parameter)
      } catch (e) { }
    }
  }
  return parameter
}
