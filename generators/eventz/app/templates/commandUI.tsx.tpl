import { useState } from 'react';

export const <%- commandType %>UI = () => {
  const [formData, setFormData] = useState<{ <%- commandPayload %> }>(<%- commandPayloadDefaults %>);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch('/api/<%= commandSlug %>', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage('Command submitted successfully!');
        setIsError(false);
        setFormData(<%- commandPayloadDefaults %>);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage(errorData.message || 'Error submitting command.');
        setIsError(true);
      }
    } catch (error) {
      setMessage('Error submitting command. Please check your connection.');
      setIsError(true);
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
      {message && (
        <div className={`alert ${isError ? 'alert-error' : 'alert-success'}`} role="alert">
          {message}
        </div>
      )}
    </div>
  );
};
