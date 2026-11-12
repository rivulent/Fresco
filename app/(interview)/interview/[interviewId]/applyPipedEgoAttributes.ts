import type { InterviewPayload } from '@codaco/interview/contract';
import type { GetInterviewByIdQuery } from '~/queries/interviews';
import type { PipedData } from '~/schemas/interviews';

type Codebook = NonNullable<GetInterviewByIdQuery>['protocol']['codebook'];
type EgoVariable = NonNullable<
  NonNullable<Codebook['ego']>['variables']
>[string];
type Network = InterviewPayload['session']['network'];
type PipedValue = PipedData[string];
type AttributeValue = string | number | boolean;

/**
 * Convert a piped value to the shape the codebook variable stores, or
 * `undefined` when it cannot be represented. Only scalar variable types are
 * supported; anything else is left alone rather than written in a shape the
 * rest of the interview would not expect.
 */
function coerceToVariable(
  variable: EgoVariable,
  value: PipedValue,
): AttributeValue | undefined {
  if (value === null) return undefined;

  switch (variable.type) {
    case 'number':
    case 'scalar': {
      if (typeof value === 'boolean') return undefined;
      if (typeof value === 'string' && value.trim() === '') return undefined;
      const number = Number(value);
      return Number.isFinite(number) ? number : undefined;
    }
    case 'text':
      return String(value);
    case 'boolean': {
      if (typeof value === 'boolean') return value;
      const normalised = String(value).trim().toLowerCase();
      if (normalised === 'true') return true;
      if (normalised === 'false') return false;
      return undefined;
    }
    case 'ordinal': {
      // Ordinal attributes store one option's value. Match on the string form
      // so a piped "2" selects the option whose value is the number 2.
      const option = variable.options.find(
        (candidate) => String(candidate.value) === String(value),
      );
      return option?.value;
    }
    default:
      return undefined;
  }
}

/**
 * Write piped-in values into the ego attributes of any codebook ego variable
 * whose `name` matches a piped key.
 *
 * This is what lets stage skip logic depend on piped data: rules can only read
 * codebook variables, so a protocol declares an ego variable named after the
 * piped key (e.g. `B1_AUDIT`) and an ordinary ego rule (`B1_AUDIT > 0`) does
 * the rest. Piped data is the source of truth, so a matching value is written
 * on every load — a value corrected upstream reaches resumed interviews too.
 * A key with no usable value (missing, null, or not convertible to the
 * variable's type) leaves the attribute untouched, which skip logic reads the
 * same as unanswered.
 *
 * Keys with no matching ego variable are ignored; they remain available for
 * `{{key}}` text substitution through `network.pipedData`.
 */
export function applyPipedEgoAttributes(
  network: Network,
  pipedData: PipedData | null,
  codebook: Codebook,
): Network {
  const egoVariables = codebook.ego?.variables;
  if (!pipedData || !egoVariables) return network;

  const patch: Record<string, AttributeValue> = {};
  for (const [variableId, variable] of Object.entries(egoVariables)) {
    if (!Object.hasOwn(pipedData, variable.name)) continue;
    const value = coerceToVariable(variable, pipedData[variable.name] ?? null);
    if (value !== undefined) patch[variableId] = value;
  }

  if (Object.keys(patch).length === 0) return network;

  return {
    ...network,
    ego: {
      ...network.ego,
      attributes: { ...network.ego.attributes, ...patch },
    },
  };
}
