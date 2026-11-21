const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export const fetchMessages = async (ideaId) => {
    const response = await fetch(`${API_URL}/chat/${ideaId}/messages`, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch messages");
    }

    return await response.json();
};

export const fetchMembers = async (ideaId) => {
    const response = await fetch(`${API_URL}/chat/${ideaId}/members`, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch idea members");
    }

    return await response.json();
};

export const postMessageApi = async (ideaId, content) => {
    const response = await fetch(`${API_URL}/chat/${ideaId}/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to post message");
    }

    return data;
};

