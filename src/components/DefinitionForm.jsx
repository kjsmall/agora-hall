// File: DefinitionForm.jsx
import React from 'react';

export default function DefinitionForm({ definitions, setDefinitions, debateStarted }) {
  const updateDefinition = (index, field, value) => {
    const newDefinitions = [...definitions];
    newDefinitions[index][field] = value;
    setDefinitions(newDefinitions);
  };

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Define Key Terms</h3>
      {definitions.map((def, index) => (
        <div key={index} className="flex mb-2 gap-2">
          {debateStarted ? (
            <>
              <span className="font-semibold">{def.term}:</span>
              <span>{def.definition}</span>
            </>
          ) : (
            <>
              <input
                className="p-2 border rounded w-1/3"
                type="text"
                placeholder="Term"
                value={def.term}
                onChange={(e) => updateDefinition(index, 'term', e.target.value)}
              />
              <input
                className="p-2 border rounded w-2/3"
                type="text"
                placeholder="Definition"
                value={def.definition}
                onChange={(e) => updateDefinition(index, 'definition', e.target.value)}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}