import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Check } from "lucide-react";
import { useCampus, CAMPUSES, Campus } from "@/contexts/CampusContext";

const CampusSelector = () => {
  const { selectedCampus, setSelectedCampus, getCampusDisplayName } = useCampus();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter campuses based on search query
  const filteredCampuses = CAMPUSES.filter((campus) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      campus.name.toLowerCase().includes(searchLower) ||
      campus.location.toLowerCase().includes(searchLower)
    );
  });

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 280),
    });
  };

  // Update position when opening or on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    
    updateMenuPosition();

    const handleUpdate = () => updateMenuPosition();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);

      if (!clickedTrigger && !clickedDropdown) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (campus: Campus) => {
    setSelectedCampus(campus);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateMenuPosition();
    }
    setIsOpen((v) => !v);
  };

  return (
    <div className="relative inline-block" onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className="group flex items-center gap-2 px-4 py-2.5 rounded-sm bg-background/60 backdrop-blur-sm border border-border/50 hover:border-border/80 hover:bg-background/80 transition-all duration-300"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-sm text-muted-foreground">
          JustOne is live at{" "}
          <span className="text-foreground font-medium">{getCampusDisplayName()}</span>
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-muted-foreground group-hover:text-foreground transition-all duration-200 ${
            isOpen ? "rotate-180" : ""
          }`} 
        />
      </button>

      {/* Dropdown Portal */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] animate-in fade-in-0 duration-200"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              maxWidth: "calc(100vw - 32px)",
            }}
          >
            <div 
              className="border border-border rounded-sm shadow-2xl overflow-hidden"
              style={{ backgroundColor: 'hsl(var(--card))' }}
            >
              {/* Search Input */}
              <div 
                className="p-3 border-b border-border/40"
                style={{ backgroundColor: 'hsl(var(--card))' }}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search campuses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all"
                    style={{ backgroundColor: 'hsl(var(--background))' }}
                  />
                </div>
              </div>

              {/* Campus List */}
              <div 
                className="max-h-[240px] overflow-y-auto" 
                role="listbox"
                style={{ backgroundColor: 'hsl(var(--card))' }}
              >
                {filteredCampuses.length === 0 ? (
                  <div 
                    className="px-4 py-6 text-center text-sm text-muted-foreground/60"
                    style={{ backgroundColor: 'hsl(var(--card))' }}
                  >
                    No campuses found
                  </div>
                ) : (
                  <div className="py-1" style={{ backgroundColor: 'hsl(var(--card))' }}>
                    {filteredCampuses.map((campus) => {
                      const isSelected = campus.id === selectedCampus.id;
                      return (
                        <button
                          key={campus.id}
                          onClick={() => handleSelect(campus)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left transition-all duration-200 hover:opacity-80"
                          style={{ 
                            backgroundColor: isSelected 
                              ? 'hsl(var(--primary) / 0.1)' 
                              : 'hsl(var(--card))' 
                          }}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div>
                            <div
                              className={`text-sm font-medium ${
                                isSelected ? "text-primary" : "text-foreground"
                              }`}
                            >
                              {campus.name}
                            </div>
                            <div className="text-xs text-muted-foreground/70 mt-0.5">
                              {campus.location}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CampusSelector;

