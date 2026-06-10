import React from "react";
import { RadioGroup, useRadio, VisuallyHidden, cn } from "@nextui-org/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const typeConfig = {
    income: {
        icon: "fa-solid fa-arrow-up",
        color: "data-[selected=true]:bg-success data-[selected=true]:text-white data-[selected=true]:border-success",
        label: "Income",
    },
    expense: {
        icon: "fa-solid fa-arrow-down",
        color: "data-[selected=true]:bg-danger data-[selected=true]:text-white data-[selected=true]:border-danger",
        label: "Expense",
    },
    transfer: {
        icon: "fa-solid fa-arrow-right-arrow-left",
        color: "data-[selected=true]:bg-secondary data-[selected=true]:text-white data-[selected=true]:border-secondary",
        label: "Transfer",
    },
};

export const CustomRadio = (props) => {
    const {
        Component,
        children,
        getBaseProps,
        getWrapperProps,
        getInputProps,
        getLabelProps,
        getLabelWrapperProps,
    } = useRadio(props);

    return (
        <Component
            {...getBaseProps()}
            className={cn(
                "group inline-flex items-center hover:opacity-80 active:opacity-60 justify-center tap-highlight-transparent",
                "cursor-pointer border-2 border-default-200 rounded-xl gap-2 py-2.5 px-4 transition-all",
                "data-[selected=true]:border-primary grow",
                props.className
            )}
        >
            <VisuallyHidden>
                <input {...getInputProps()} />
            </VisuallyHidden>
            <div {...getLabelWrapperProps()} className="flex items-center gap-2">
                {children && <span {...getLabelProps()}>{children}</span>}
            </div>
        </Component>
    );
};

export default function SelectType({ onChange, value }) {
    return (
        <RadioGroup name="type" onChange={onChange} value={value} isRequired>
            <div className="flex flex-row justify-between gap-x-2">
                {Object.entries(typeConfig).map(([key, config]) => (
                    <CustomRadio
                        key={key}
                        value={key}
                        className={config.color}
                    >
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                            <FontAwesomeIcon icon={config.icon} />
                            {config.label}
                        </span>
                    </CustomRadio>
                ))}
            </div>
        </RadioGroup>
    );
}
