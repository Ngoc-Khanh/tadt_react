import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import { TbZoomScan } from "react-icons/tb";
import { TbCurrentLocation } from "react-icons/tb";

interface AccordionUsageProps {
    onLayerClick: () => void;
}

export default function AccordionUsage({ onLayerClick }: AccordionUsageProps) {
    return (
        <div>
            {["Default layer", "Zone layer", "Category layer"].map((layer, index) => (
                <Accordion key={index} defaultExpanded={index === 0}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`panel${index}-content`}
                        id={`panel${index}-header`}
                    >
                        <Typography component="span">{layer}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Button
                            onClick={onLayerClick}
                            className="flex w-full justify-between items-center"
                            style={{ color: 'black' }}
                            fullWidth
                        >
                            <TbZoomScan className='w-6 h-6' />
                            <div className="flex flex-col flex-1 mx-2 gap-1">
                                <label className='text-sm font-semibold'>Polygon_00{index + 1}</label>
                                <label className='text-sm' style={{ fontSize: 10 }}>Chưa có dự án</label>
                            </div>
                            <TbCurrentLocation className='w-6 h-6' />
                        </Button>
                    </AccordionDetails>
                </Accordion>
            ))}
        </div>
    );
} 