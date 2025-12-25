import { useState } from 'react';

export const <%- commandType %>UI = () => {
  const [formData, setFormData] = useState<{ <%- commandPayload %> }>(<%- commandPayloadDefaults %>);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/<%= commandSlug %>', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage('Command submitted successfully!');
        setFormData(<%- commandPayloadDefaults %>);
      } else {
        setMessage('Error submitting command.');
      }
    } catch (error) {
      setMessage('Error submitting command.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="command-ui">
      <h3><%- commandTitle %></h3>
      <form onSubmit={handleSubmit}>
<%- formFields %>
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};
