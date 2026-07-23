/**
 * Hook de dados/estado (useLocalStorageState).
 */

import { useEffect, useRef, useState } from "react";

type Parser<T> = (raw: string | null) => T | null;
type Serializer<T> = (value: T) => string;

export const useLocalStorageState = <T>(
  key: string,
  defaultValue: T,
  parse: Parser<T>,
  serialize: Serializer<T>,
) => {
  const [value, setValue] = useState<T>(defaultValue);
  const parseRef = useRef(parse);
  const serializeRef = useRef(serialize);

  // Mantem as funcoes atualizadas sem disparar efeitos a cada render.
  useEffect(() => {
    parseRef.current = parse;
    serializeRef.current = serialize;
  }, [parse, serialize]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const parsed = parseRef.current(window.localStorage.getItem(key));
    if (parsed !== null) {
      setValue(parsed);
    }
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, serializeRef.current(value));
  }, [key, value]);

  return [value, setValue] as const;
};
