import { Button } from "~/components/ui/button";

export default function TestView() {
  function handleClick() {
    console.log('Test button clicked!');
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Test View</h1>
      <Button
        onClick={handleClick}
      >
        Test Button
      </Button>
    </div>
  );
}
