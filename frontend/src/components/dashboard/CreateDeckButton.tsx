import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const CreateDeckButton: React.FC<React.ComponentProps<typeof Button>> = ({
  ref,
  ...other
}: React.ComponentProps<typeof Button>) => {
  return (
    <Button variant="secondary" size={"deckbutton"} ref={ref} {...other}>
      <Plus /> Create deck
    </Button>
  );
};

export default CreateDeckButton;
