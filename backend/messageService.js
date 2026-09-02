const supabase = require("./supabase");


// Save a message
async function saveMessage(sessionId, role, content) {

    const { error } = await supabase
        .from("messages")
        .insert({
            session_id: sessionId,
            role: role,
            content: content
        });

    if (error) {
        throw new Error(error.message);
    }
}


// Get previous conversation
async function getMessages(sessionId) {

    const { data, error } = await supabase
        .from("messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", {
            ascending: true
        });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}


module.exports = {
    saveMessage,
    getMessages
};