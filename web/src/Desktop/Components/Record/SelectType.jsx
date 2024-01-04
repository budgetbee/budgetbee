import React from "react";
import { RadioGroup, useRadio, VisuallyHidden, cn } from "@nextui-org/react";

export const CustomRadio = (props) => {
    const {
        Component,
        children,
        getBaseProps,
        getWrapperProps,
        getInputProps,
        getLabelProps,
        getLabelWrapperProps,
        getControlProps,
    } = useRadio(props);

    return (
        <Component
            {...getBaseProps()}
            className={cn(
                "group inline-flex items-center hover:opacity-70 active:opacity-50 justify-between flex-row-reverse tap-highlight-transparent",
                "max-w-[300px] cursor-pointer border-2 border-default rounded-lg gap-4 p-4",
                "data-[selected=true]:border-primary grow"
            )}
        >
            <VisuallyHidden>
                <input {...getInputProps()} />
            </VisuallyHidden>
            <span {...getWrapperProps()}>
                <span {...getControlProps()} />
            </span>
            <div {...getLabelWrapperProps()}>
                {children && <span {...getLabelProps()}>{children}</span>}
            </div>
        </Component>
    );
};

export default function SelectType({ onChange, value }) {
    return (
        <RadioGroup name="type" onChange={onChange} value={value} isRequired>
            <div className="flex flex-row justify-between gap-x-3">
                <CustomRadio value="income">Income</CustomRadio>
                <CustomRadio value="expense">Expense</CustomRadio>
                <CustomRadio value="transfer">Transfer</CustomRadio>
            </div>
        </RadioGroup>
    );
}
