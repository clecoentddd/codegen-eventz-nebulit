import { useState } from 'react';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import TextInput from '../../../components/ui/TextInput';

export const AdminConnecteUI = () => {
  const [formData, setFormData] = useState<{ adminEmail: string }>({ adminEmail: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submissions
    if (loading) return;
    
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch('/api/admin-connecte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage('Command submitted successfully!');
        setIsError(false);
        setFormData({ adminEmail: '' });
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
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Admin Connecté</h3>
        <Badge variant="muted">Command</Badge>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
                <TextInput
                    label="adminEmail"
                    type="text"
                    id="adminEmail"
                    name="adminEmail"
                    value={formData['adminEmail']}
                    onChange={handleChange}
                    required
                />

        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
      {message && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${isError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
          role="alert"
        >
          {message}
        </div>
      )}
    </div>
  );
};
