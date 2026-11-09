import { CalendarX } from 'lucide-react';

import Surface from '@codaco/fresco-ui/layout/Surface';
import Heading from '@codaco/fresco-ui/typography/Heading';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';

/**
 * Rivulent: shown in place of an interview whose window has closed.
 */
export default function InterviewExpired() {
  return (
    <Surface className="flex h-screen flex-col items-center justify-center">
      <CalendarX className="text-warning mb-4 size-12" />
      <Heading level="h1">This interview is closed</Heading>
      <Paragraph>
        The time available to complete this interview has ended.
      </Paragraph>
    </Surface>
  );
}
