import "./AIChat.css";
import { useState } from "react";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  LoaderCircle,
} from "lucide-react";

function AIChat({ income = 0, expenses = 0, balance = 0 }) {
  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! 👋 I'm your ExpenseFlow AI Assistant. Ask me about your income, expenses, savings, or budget.",
    },
  ]);

  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!question.trim() || loading) return;

    const userQuestion = question.trim();

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userQuestion },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in again to use the AI Assistant.");
      }

      const apiBase = (
        import.meta.env.VITE_API_URL ||
        "https://ai-expense-tracker-ttwt.onrender.com/api"
      ).replace(/\/$/, "");

      const response = await fetch(`${apiBase}/ai/chat`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          question: userQuestion,
          income,
          expenses,
          balance,
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "Server JSON response नहीं भेज रहा है। Backend API URL या route में समस्या है।"
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "AI request failed.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer || "Sorry, I couldn't generate a response.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: error.message || "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ai-chat-card">
      <div className="ai-chat-header">
        <div className="ai-chat-icon">
          <Bot size={25} />
        </div>

        <div>
          <h2>ExpenseFlow AI</h2>
          <p>Your Personal Finance Assistant</p>
        </div>
      </div>

      <div className="ai-chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`ai-message ${
              message.role === "user"
                ? "user-message"
                : "assistant-message"
            }`}
          >
            <span className="ai-message-icon">
              {message.role === "user" ? (
                <User size={17} />
              ) : (
                <MessageCircle size={17} />
              )}
            </span>

            <p>{message.text}</p>
          </div>
        ))}

        {loading && (
          <div className="ai-loading">
            <LoaderCircle size={18} className="ai-spinner" />
            <span>AI is thinking...</span>
          </div>
        )}
      </div>

      <form className="ai-chat-form" onSubmit={handleSend}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your expenses..."
          disabled={loading}
          aria-label="Ask ExpenseFlow AI"
        />

        <button
          type="submit"
          disabled={loading || !question.trim()}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>

      <p className="ai-chat-note">
        AI suggestions are estimates, not guaranteed financial advice.
      </p>
    </section>
  );
}

export default AIChat;