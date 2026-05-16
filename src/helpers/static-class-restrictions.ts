const STATIC_CLASS_MEMBER_MESSAGE = "Static class members are not allowed. Use instance behaviour or module-level composition instead.";

export const staticClassRestrictions = [
    {
        selector: "PropertyDefinition[static=true]",
        message: STATIC_CLASS_MEMBER_MESSAGE,
    },
    {
        selector: "MethodDefinition[static=true]",
        message: STATIC_CLASS_MEMBER_MESSAGE,
    },
    {
        selector: "StaticBlock",
        message: STATIC_CLASS_MEMBER_MESSAGE,
    },
];
