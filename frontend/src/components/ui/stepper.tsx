import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
    title: string;
    description?: string;
}

interface StepperProps {
    steps: Step[];
    currentStep: number;
}

const Stepper = ({ steps, currentStep }: StepperProps) => {
    return (
        <div className="w-full">
            <div className="flex items-start justify-center">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-start">
                        {/* Step circle and label */}
                        <div className="flex flex-col items-center w-32 sm:w-40 md:w-48">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all",
                                    index < currentStep
                                        ? "bg-blue-600 text-white"
                                        : index === currentStep
                                          ? "bg-blue-600 text-white ring-4 ring-blue-100"
                                          : "bg-gray-200 text-gray-500"
                                )}
                            >
                                {index < currentStep ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <div className="mt-3 text-center">
                                <p
                                    className={cn(
                                        "text-sm font-medium",
                                        index <= currentStep
                                            ? "text-gray-900"
                                            : "text-gray-500"
                                    )}
                                >
                                    {step.title}
                                </p>
                                {step.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {step.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Connector line */}
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    "h-0.5 mt-5 -mx-8 sm:-mx-10 md:-mx-12 w-16 sm:w-20 md:w-24 transition-all",
                                    index < currentStep
                                        ? "bg-blue-600"
                                        : "bg-gray-200"
                                )}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Stepper;
