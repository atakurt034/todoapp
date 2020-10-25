exports.date = function () {
    const today = new Date();
    const option = {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
    };
    return today.toLocaleDateString("en-US", option);
};