/* Alert styles */
.alert {
  padding: 12px 16px;
  margin: 12px 0;
  border-radius: 4px;
  border: 1px solid;
  font-size: 14px;
}

.alert-success {
  background-color: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.alert-error {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

/* Command UI styles */
.command-ui {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.command-ui h3 {
  margin-top: 0;
  margin-bottom: 16px;
}

.command-ui form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.command-ui form div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.command-ui label {
  font-weight: 500;
  font-size: 14px;
}

.command-ui input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.command-ui input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.command-ui button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
}

.command-ui button:hover:not(:disabled) {
  background-color: #0056b3;
}

.command-ui button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Slice page styles */
.slice-page {
  padding: 20px;
}

.slice-page h2 {
  margin-bottom: 24px;
}

.commands {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
