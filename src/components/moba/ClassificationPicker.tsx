import { Checkbox } from "@/components/ui/checkbox";
import { toggleClassification } from "@/lib/hero-classification";

export function ClassificationPicker({ label, options, values, onChange }: {
  label: string;
  options: readonly string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="label-caps mb-1.5">{label}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map(option => (
          <label key={option} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={values.includes(option)} onCheckedChange={() => onChange(toggleClassification(values, option))} />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}