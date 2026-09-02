const supabase = require("./supabase");


// ==========================================
// GET PATIENT BY SUPABASE USER ID
// ==========================================

async function getPatientByUserId(userId) {

    const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}


// ==========================================
// CREATE PATIENT FOR AUTHENTICATED USER
// ==========================================

async function createPatient({
    userId,
    email,
    name = null,
    phone = null
}) {

    const { data, error } = await supabase
        .from("patients")
        .insert({
            user_id: userId,
            email: email,
            name: name,
            phone: phone
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}


// ==========================================
// GET OR CREATE PATIENT
// ==========================================

async function getOrCreatePatient({
    userId,
    email
}) {

    let patient = await getPatientByUserId(userId);

    // Patient already exists
    if (patient) {
        return patient;
    }

    // Patient doesn't exist
    patient = await createPatient({
        userId,
        email
    });

    return patient;
}


// ==========================================
// UPDATE PATIENT PROFILE
// ==========================================

async function updatePatient(
    userId,
    updates
) {

    const { data, error } = await supabase
        .from("patients")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}


module.exports = {
    getPatientByUserId,
    createPatient,
    getOrCreatePatient,
    updatePatient
};