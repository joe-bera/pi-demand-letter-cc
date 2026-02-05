'use client';

import { useState } from 'react';
import { MedicalEvent, TreatmentGap } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Stethoscope,
  Building2,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface MedicalTimelineProps {
  events: MedicalEvent[];
  gaps?: TreatmentGap[];
}

const providerTypeColors: Record<string, string> = {
  'Emergency Room': 'bg-red-500',
  'Hospital': 'bg-red-400',
  'Urgent Care': 'bg-orange-500',
  'Primary Care': 'bg-blue-500',
  'Specialist': 'bg-purple-500',
  'Physical Therapy': 'bg-green-500',
  'Chiropractor': 'bg-teal-500',
  'Imaging Center': 'bg-indigo-500',
  'Surgery Center': 'bg-pink-500',
  'Other': 'bg-gray-500',
};

export function MedicalTimeline({ events, gaps = [] }: MedicalTimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<MedicalEvent | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Create a combined timeline with events and gaps
  const timelineItems: Array<
    | { type: 'event'; data: MedicalEvent; date: Date }
    | { type: 'gap'; data: TreatmentGap; date: Date }
  > = [];

  // Add events
  events.forEach((event) => {
    timelineItems.push({
      type: 'event',
      data: event,
      date: new Date(event.dateOfService),
    });
  });

  // Add gaps
  gaps.forEach((gap) => {
    timelineItems.push({
      type: 'gap',
      data: gap,
      date: new Date(gap.startDate),
    });
  });

  // Sort by date
  timelineItems.sort((a, b) => a.date.getTime() - b.date.getTime());

  const toggleExpand = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getProviderColor = (type?: string) => {
    return providerTypeColors[type || 'Other'] || providerTypeColors['Other'];
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Treatment Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-6">
              {timelineItems.map((item, index) => {
                if (item.type === 'gap') {
                  const gap = item.data;
                  return (
                    <div key={`gap-${index}`} className="relative pl-10">
                      {/* Gap indicator */}
                      <div className="absolute left-2 w-5 h-5 rounded-full bg-orange-100 border-2 border-orange-500 flex items-center justify-center">
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                      </div>

                      <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="py-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-orange-800">
                                Treatment Gap: {gap.durationDays} days
                              </p>
                              <p className="text-xs text-orange-600">
                                {formatDate(gap.startDate)} — {formatDate(gap.endDate)}
                              </p>
                              {gap.explanation && (
                                <p className="text-sm text-orange-700 mt-1">
                                  {gap.explanation}
                                </p>
                              )}
                            </div>
                            {gap.impact && (
                              <Badge
                                variant={
                                  gap.impact === 'high'
                                    ? 'destructive'
                                    : gap.impact === 'medium'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {gap.impact} impact
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                }

                const event = item.data;
                const isExpanded = expandedEvents.has(event.id);
                const diagnoses = event.diagnoses || [];
                const painScore = event.vitalSigns?.pain_score;

                return (
                  <div key={event.id} className="relative pl-10">
                    {/* Event dot */}
                    <div
                      className={`absolute left-2 w-5 h-5 rounded-full ${getProviderColor(
                        event.providerType
                      )}`}
                    />

                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => toggleExpand(event.id)}
                    >
                      <CardContent className="py-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {formatDate(event.dateOfService)}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {event.providerType || 'Visit'}
                              </Badge>
                              {painScore !== undefined && (
                                <Badge
                                  variant={painScore >= 7 ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  Pain: {painScore}/10
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.providerName || event.facilityName || 'Provider'}
                            </p>
                            {event.chiefComplaint && (
                              <p className="text-sm mt-1 line-clamp-1">
                                {event.chiefComplaint}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t space-y-3">
                            {diagnoses.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Diagnoses
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {diagnoses.map((dx, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {dx.diagnosis_name}
                                      {dx.icd_code && (
                                        <span className="ml-1 opacity-70">
                                          ({dx.icd_code})
                                        </span>
                                      )}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {event.treatmentsProcedures &&
                              event.treatmentsProcedures.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Treatments
                                  </p>
                                  <p className="text-sm">
                                    {event.treatmentsProcedures.join(', ')}
                                  </p>
                                </div>
                              )}

                            {event.objectiveFindings && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Findings
                                </p>
                                <p className="text-sm">{event.objectiveFindings}</p>
                              </div>
                            )}

                            {event.totalCharge && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Charges
                                </p>
                                <p className="text-sm font-medium">
                                  ${event.totalCharge.toLocaleString()}
                                </p>
                              </div>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                              }}
                            >
                              View Full Details
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent?.providerName || selectedEvent?.facilityName || 'Medical Visit'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedEvent && (
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                    <p>{formatDate(selectedEvent.dateOfService)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Provider Type</p>
                    <p>{selectedEvent.providerType || 'Not specified'}</p>
                  </div>
                  {selectedEvent.facilityName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Facility</p>
                      <p>{selectedEvent.facilityName}</p>
                    </div>
                  )}
                  {selectedEvent.documentType && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Document Type</p>
                      <p>{selectedEvent.documentType}</p>
                    </div>
                  )}
                </div>

                {selectedEvent.chiefComplaint && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Chief Complaint</p>
                    <p>{selectedEvent.chiefComplaint}</p>
                  </div>
                )}

                {selectedEvent.diagnoses && selectedEvent.diagnoses.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Diagnoses</p>
                    <div className="space-y-1">
                      {selectedEvent.diagnoses.map((dx, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Badge variant="outline">{dx.icd_code || 'N/A'}</Badge>
                          <span>{dx.diagnosis_name}</span>
                          {dx.body_part && (
                            <span className="text-muted-foreground">({dx.body_part})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvent.subjectiveFindings && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Subjective Findings</p>
                    <p className="text-sm">{selectedEvent.subjectiveFindings}</p>
                  </div>
                )}

                {selectedEvent.objectiveFindings && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Objective Findings</p>
                    <p className="text-sm">{selectedEvent.objectiveFindings}</p>
                  </div>
                )}

                {selectedEvent.assessment && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assessment</p>
                    <p className="text-sm">{selectedEvent.assessment}</p>
                  </div>
                )}

                {selectedEvent.plan && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Plan</p>
                    <p className="text-sm">{selectedEvent.plan}</p>
                  </div>
                )}

                {selectedEvent.medications && selectedEvent.medications.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Medications</p>
                    <div className="space-y-1">
                      {selectedEvent.medications.map((med, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium">{med.medication_name}</span>
                          {med.dosage && <span> - {med.dosage}</span>}
                          {med.frequency && <span>, {med.frequency}</span>}
                          {med.purpose && (
                            <span className="text-muted-foreground"> ({med.purpose})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvent.keyQuotes && selectedEvent.keyQuotes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Key Quotes</p>
                    <div className="space-y-2">
                      {selectedEvent.keyQuotes.map((quote, i) => (
                        <blockquote
                          key={i}
                          className="border-l-2 border-primary pl-3 text-sm italic"
                        >
                          "{quote}"
                        </blockquote>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvent.totalCharge && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground">Charges</p>
                    <p className="text-lg font-bold">
                      ${selectedEvent.totalCharge.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
