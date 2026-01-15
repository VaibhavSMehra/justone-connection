import { createContext, useContext, useState, ReactNode } from "react";

export interface Campus {
  id: string;
  name: string;
  location: string;
  domains: string[];
}

export const CAMPUSES: Campus[] = [
  {
    id: "christ-bangalore",
    name: "Christ University",
    location: "Bangalore",
    domains: ["christuniversity.in", "christcollege.edu", "res.christuniversity.in", "mba.christuniversity.in"],
  },
  {
    id: "ashoka-sonipat",
    name: "Ashoka University",
    location: "Sonipat",
    domains: ["ashoka.edu.in"],
  },
  {
    id: "jindal-sonipat",
    name: "OP Jindal University",
    location: "Sonipat",
    domains: ["jgu.edu.in"],
  },
];

interface CampusContextType {
  selectedCampus: Campus;
  setSelectedCampus: (campus: Campus) => void;
  getCampusDisplayName: () => string;
}

const CampusContext = createContext<CampusContextType | undefined>(undefined);

export const CampusProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCampus, setSelectedCampus] = useState<Campus>(CAMPUSES[0]);

  const getCampusDisplayName = () => {
    return `${selectedCampus.name}, ${selectedCampus.location}`;
  };

  return (
    <CampusContext.Provider value={{ selectedCampus, setSelectedCampus, getCampusDisplayName }}>
      {children}
    </CampusContext.Provider>
  );
};

export const useCampus = () => {
  const context = useContext(CampusContext);
  if (!context) {
    throw new Error("useCampus must be used within a CampusProvider");
  }
  return context;
};
