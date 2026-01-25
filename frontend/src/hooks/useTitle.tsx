import { useEffect } from "react";

const useTitle = (title: string) => {
	useEffect(() => {
		document.title = `Genki — ${title}`;
	}, [title]);
};

export default useTitle;
