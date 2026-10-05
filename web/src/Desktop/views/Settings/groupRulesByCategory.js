/**
 * Folds a list of rules into one block per category.
 *
 * Why: with forty rules, one line per word is a wall nobody reads. Read by
 * category, the same forty rules are five or six blocks, and inside each block
 * you see the words it reacts to and how many movements each one has caught.
 *
 * Each block keeps: the category (name, colour and icon, so the screen can paint
 * its header), the movements caught by all of its words together, and how many
 * of those words the user added himself.
 *
 * @param {Array} list          rules as the API sends them
 * @param {Function} categoryName  (id) => name, to fall back when the rule
 *                                 carries no name (deleted or unknown category)
 * @returns {Array} blocks, biggest first, then by name
 */
export default function groupRulesByCategory(list, categoryName = () => null) {
    const groups = new Map();

    (list || []).forEach((rule) => {
        const key = rule.category_id ?? 0;

        if (!groups.has(key)) {
            groups.set(key, {
                id: key,
                name: rule.category_name || categoryName(rule.category_id) || "No category",
                color: rule.category_color || "#6b7280",
                icon: rule.icon || "fa-solid fa-tag",
                rules: [],
                caught: 0,
                mine: 0,
            });
        }

        const group = groups.get(key);
        group.rules.push(rule);
        // `matching_records` is the live count the API also uses to build the list
        // a block opens: the number and the movements behind it always agree.
        group.caught += Number(rule.matching_records || 0);

        if (rule.source !== "learned") {
            group.mine += 1;
        }
    });

    return Array.from(groups.values()).sort(
        (a, b) => b.rules.length - a.rules.length || a.name.localeCompare(b.name)
    );
}
