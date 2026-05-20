import React, { useMemo } from 'react';
import UIPrompts from '~/lib/ui/components/Prompts/Prompts';
import { useSelector } from 'react-redux';
import { usePrompts } from '../behaviours/withPrompt';
import { useSubstitutePipedText } from '../utils/pipedText';

const Prompts = () => {
  const { prompt, prompts } = usePrompts();
  const speakable = useSelector(
    (state) => state.deviceSettings.enableExperimentalTTS,
  );
  const substitutePipedText = useSubstitutePipedText();

  // Apply piped text substitution to prompt text
  const processedPrompts = useMemo(
    () =>
      prompts.map((p) => ({
        ...p,
        text: substitutePipedText(p.text),
      })),
    [prompts, substitutePipedText],
  );

  return (
    <UIPrompts
      speakable={speakable}
      currentPromptId={prompt.id}
      prompts={processedPrompts}
    />
  );
};

export default Prompts;
