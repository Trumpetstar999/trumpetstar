import { useEffect } from 'react';

interface HowToStep {
  position: number;
  name: string;
  text: string;
  image?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string;
}

export function HowToSchema({ name, description, steps, totalTime }: HowToSchemaProps) {
  useEffect(() => {
    const schema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": name,
      "description": description,
      "step": steps.map(step => ({
        "@type": "HowToStep",
        "position": step.position,
        "name": step.name,
        "text": step.text,
        ...(step.image && { "image": step.image })
      }))
    };

    if (totalTime) {
      schema.totalTime = totalTime;
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    script.id = 'howto-schema';
    
    const existing = document.getElementById('howto-schema');
    if (existing) existing.remove();
    
    document.head.appendChild(script);

    return () => {
      const schemaElement = document.getElementById('howto-schema');
      if (schemaElement) schemaElement.remove();
    };
  }, [name, description, steps, totalTime]);

  return null;
}

export default HowToSchema;
