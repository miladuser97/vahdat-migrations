import { useId, type ReactNode } from "react";
import { Label } from "@/components/ui/Label";
import { HelperText } from "@/components/ui/HelperText";
import { FormMessage } from "@/components/ui/FormMessage";
import { buildDescribedBy } from "@/utils/form-utils";

export interface FormFieldRenderProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export interface FormFieldProps {
  label: string;
  helperText?: string;
  errorMessage?: string;
  required?: boolean;
  children: (fieldProps: FormFieldRenderProps) => ReactNode;
}

/**
 * FormField
 * One responsibility: wire a Label, an arbitrary field, a HelperText,
 * and an error FormMessage together with the correct ids and
 * aria-describedby/aria-invalid — the accessibility plumbing every
 * form field needs, written once instead of by hand each time.
 *
 * The field is provided as a render prop (not JSX children) because it
 * needs the generated `id`/`aria-*` values; this keeps the wiring
 * type-safe instead of relying on cloning an arbitrary element.
 *
 * Example:
 * ```tsx
 * <FormField label="ایمیل" helperText="ایمیلی که برایتان پیام می‌فرستیم">
 *   {(fieldProps) => <Input type="email" {...fieldProps} />}
 * </FormField>
 * ```
 */
export function FormField({
  label,
  helperText,
  errorMessage,
  required = false,
  children,
}: FormFieldProps) {
  const id = useId();
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = errorMessage ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-xs">
      <Label htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-error">
            {" "}
            *
          </span>
        )}
      </Label>

      {children({
        id,
        "aria-describedby": buildDescribedBy(helperId, errorId),
        "aria-invalid": Boolean(errorMessage) || undefined,
      })}

      {helperText && !errorMessage && <HelperText id={helperId}>{helperText}</HelperText>}
      {errorMessage && (
        <FormMessage id={errorId} variant="error">
          {errorMessage}
        </FormMessage>
      )}
    </div>
  );
}
