// Helpers de validação para dados de FormData recebidos em Server Actions
// (fronteira com o usuário) — sem depender de uma lib externa.

export function requiredString(formData: FormData, key: string): string {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`Campo obrigatório: ${key}`);
  return value;
}

export function optionalString(formData: FormData, key: string): string | undefined {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
}

export function requiredEnum<T extends string>(
  formData: FormData,
  key: string,
  allowed: readonly T[],
): T {
  const value = String(formData.get(key) ?? "");
  if (!allowed.includes(value as T)) {
    throw new Error(`Valor inválido para ${key}: ${value}`);
  }
  return value as T;
}

export function enumList<T extends string>(
  formData: FormData,
  key: string,
  allowed: readonly T[],
): T[] {
  return formData
    .getAll(key)
    .map(String)
    .filter((v): v is T => allowed.includes(v as T));
}
