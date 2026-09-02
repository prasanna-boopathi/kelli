const supabase = require("./supabase");

async function testDatabase() {

    const { data, error } = await supabase
        .from("doctors")
        .select("*");

    if (error) {
        console.error("Database error:");
        console.error(error);
        return;
    }

    console.log("Doctors from Supabase:");
    console.log(data);
}

testDatabase();