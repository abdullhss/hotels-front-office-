import { useEffect, useState } from "react";
import { executeProcedure } from "../services/apiServices";

const useCountries = ( id , searchText = "") => {
  const [Countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);  

  useEffect(() => {
    const getCountries = async () => {
      try {
        setLoading(true);
        const response = await executeProcedure("Bp02zhHaygo2MoX9CHb+vA==" , `${id}#${searchText}`);
        console.log(response);
        
        setTotalCount(Number(response.decrypted.CountryCount));
        setCountries(response.decrypted.CountryData?JSON.parse(response.decrypted.CountryData):[]);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    getCountries();
  }, [id, searchText]);

  return { Countries, totalCount, loading, error };
};

export default useCountries;
