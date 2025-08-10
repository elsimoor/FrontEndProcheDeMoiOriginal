"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const GET_RESTAURANT_SETTINGS = gql`
  query Restaurant($id: ID!) {
    restaurant(id: $id) {
      id
      settings {
        horaires {
          ouverture
          fermeture
          prix
        }
        capaciteTotale
        tables {
          size2
          size4
          size6
          size8
        }
        frequenceCreneauxMinutes
        maxReservationsParCreneau

        # Nouvelles données : périodes de fermeture, jours ouverts et tables personnalisées
        fermetures {
          debut
          fin
        }
        joursOuverts
        customTables {
          taille
          nombre
        }
      }
    }
  }
`;

const UPDATE_RESTAURANT_MUTATION = gql`
    mutation UpdateRestaurant($id: ID!, $input: UpdateRestaurantInput!) {
        updateRestaurant(id: $id, input: $input) {
            id
        }
    }
`;

const formSchema = z.object({
  horaires: z.array(
    z.object({
      ouverture: z.string(),
      fermeture: z.string(),
      prix: z.coerce.number().min(0, "Le prix doit être un nombre positif."),
    })
  ).min(1, "Au moins une plage horaire est requise."),
  capaciteTotale: z.coerce.number().positive("La capacité totale doit être un nombre positif."),
  tables: z.object({
    size2: z.coerce.number().min(0, "Doit être un nombre positif."),
    size4: z.coerce.number().min(0, "Doit être un nombre positif."),
    size6: z.coerce.number().min(0, "Doit être un nombre positif."),
    size8: z.coerce.number().min(0, "Doit être un nombre positif."),
  }),
  frequenceCreneauxMinutes: z.coerce.number().positive("La fréquence doit être un nombre positif."),
  maxReservationsParCreneau: z.coerce.number().positive("La limite doit être un nombre positif."),
  // Périodes de fermeture : tableau de périodes avec une date de début et de fin
  fermetures: z.array(
    z.object({
      debut: z.string(),
      fin: z.string(),
    })
  ).optional(),
  // Jours ouverts : liste de jours (ex. "Monday")
  joursOuverts: z.array(z.string()).optional(),
  // Tables personnalisées : taille et nombre de tables
  customTables: z.array(
    z.object({
      taille: z.coerce.number().min(1, "La taille doit être un nombre positif."),
      nombre: z.coerce.number().min(0, "Le nombre doit être un nombre positif."),
    })
  ).optional(),
})
.refine(data => {
    // Validate that for any schedule, opening time is before closing time.
    return data.horaires.every(h => !h.ouverture || !h.fermeture || h.ouverture < h.fermeture);
}, {
    message: "L'heure d'ouverture doit être antérieure à l'heure de fermeture pour chaque plage.",
    path: ["horaires"],
})
.refine(data => data.frequenceCreneauxMinutes > 0 && data.frequenceCreneauxMinutes % 5 === 0, {
    message: "La fréquence des créneaux doit être un multiple de 5 (ex: 15, 30, 60).",
    path: ["frequenceCreneauxMinutes"],
})
.refine(data => data.maxReservationsParCreneau <= data.capaciteTotale, {
    message: "La limite par créneau ne peut pas dépasser la capacité totale.",
    path: ["maxReservationsParCreneau"],
});

export default function TablesDisponibilitesPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      horaires: [
        { ouverture: "", fermeture: "", prix: 0 },
        { ouverture: "", fermeture: "", prix: 0 },
      ],
      capaciteTotale: 0,
      tables: { size2: 0, size4: 0, size6: 0, size8: 0 },
      frequenceCreneauxMinutes: 0,
      maxReservationsParCreneau: 0,
      fermetures: [],
      joursOuverts: [],
      customTables: [],
    },
  });

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) {
          setSessionLoading(false);
          return;
        }
        const data = await res.json();
        if (data.businessType && data.businessType.toLowerCase() === "restaurant" && data.businessId) {
          setRestaurantId(data.businessId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSessionLoading(false);
      }
    }
    fetchSession();
  }, []);

  const { loading: queryLoading, error: queryError } = useQuery(GET_RESTAURANT_SETTINGS, {
    variables: { id: restaurantId },
    skip: !restaurantId,
    onCompleted: (data) => {
      if (data.restaurant && data.restaurant.settings) {
        const settings = data.restaurant.settings;
        // Ensure each horaire has a prix value. Default to 0 if undefined.
        const horairesWithPrix = settings.horaires && settings.horaires.length
          ? settings.horaires.map((h: any) => ({
              ouverture: h.ouverture || "",
              fermeture: h.fermeture || "",
              prix: h.prix ?? 0,
            }))
          : [
              { ouverture: "", fermeture: "", prix: 0 },
              { ouverture: "", fermeture: "", prix: 0 },
            ];

        // Prepare closure periods
        const fermetures = settings.fermetures?.length
          ? settings.fermetures.map((f: any) => ({
              debut: f.debut || "",
              fin: f.fin || "",
            }))
          : [];

        // Prepare joursOuverts as simple array of strings
        const joursOuverts = Array.isArray(settings.joursOuverts) ? settings.joursOuverts : [];

        // Prepare custom tables
        const customTables = settings.customTables?.length
          ? settings.customTables.map((t: any) => ({
              taille: t.taille,
              nombre: t.nombre,
            }))
          : [];

        form.reset({
          horaires: horairesWithPrix,
          capaciteTotale: settings.capaciteTotale || 0,
          tables: settings.tables || { size2: 0, size4: 0, size6: 0, size8: 0 },
          frequenceCreneauxMinutes: settings.frequenceCreneauxMinutes || 0,
          maxReservationsParCreneau: settings.maxReservationsParCreneau || 0,
          fermetures: fermetures,
          joursOuverts: joursOuverts,
          customTables: customTables,
        });
      }
    },
  });

  const [updateRestaurant, { loading: updateLoading }] = useMutation(UPDATE_RESTAURANT_MUTATION);

  // Use field array for dynamic horaires
  const { fields: horaireFields, append, remove } = useFieldArray({
    control: form.control,
    name: "horaires",
  });

  // Field array for closure periods (fermetures)
  const {
    fields: fermetureFields,
    append: appendFermeture,
    remove: removeFermeture,
  } = useFieldArray({
    control: form.control,
    name: "fermetures",
  });

  // Field array for custom tables
  const {
    fields: customTableFields,
    append: appendCustomTable,
    remove: removeCustomTable,
  } = useFieldArray({
    control: form.control,
    name: "customTables",
  });

  const watchTables = form.watch("tables");
  const watchCapaciteTotale = form.watch("capaciteTotale");

  // Watch custom tables to compute theoretical capacity
  const watchCustomTables = form.watch("customTables");

  const capaciteTheorique =
    ((watchTables.size2 || 0) * 2 +
    (watchTables.size4 || 0) * 4 +
    (watchTables.size6 || 0) * 6 +
    (watchTables.size8 || 0) * 8) +
    // Add contribution from custom tables
    (Array.isArray(watchCustomTables)
      ? watchCustomTables.reduce((sum: number, ct: any) => {
          const taille = parseInt(String(ct?.taille ?? 0));
          const nombre = parseInt(String(ct?.nombre ?? 0));
          if (!isNaN(taille) && !isNaN(nombre)) {
            return sum + taille * nombre;
          }
          return sum;
        }, 0)
      : 0);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!restaurantId) return;

    try {
      await updateRestaurant({
        variables: {
          id: restaurantId,
          input: {
            settings: values,
          },
        },
      });
      toast.success("Modifications enregistrées");
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue.");
    }
  }

  if (sessionLoading || queryLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des tables et des disponibilités</h1>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* Jours d’ouverture */}
          <Card>
            <CardHeader>
              <CardTitle>Jours d’ouverture</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="joursOuverts"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <label key={day} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={field.value?.includes(day)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (checked) {
                                field.onChange([...(field.value || []), day]);
                              } else {
                                field.onChange(field.value?.filter((v: string) => v !== day));
                              }
                            }}
                          />
                          <span className="text-sm text-gray-700">
                            {(() => {
                              switch (day) {
                                case 'Monday':
                                  return 'Lundi';
                                case 'Tuesday':
                                  return 'Mardi';
                                case 'Wednesday':
                                  return 'Mercredi';
                                case 'Thursday':
                                  return 'Jeudi';
                                case 'Friday':
                                  return 'Vendredi';
                                case 'Saturday':
                                  return 'Samedi';
                                case 'Sunday':
                                  return 'Dimanche';
                              }
                            })()}
                          </span>
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horaires d’ouverture et de fermeture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {horaireFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <FormField
                    control={form.control}
                    name={`horaires.${index}.ouverture`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heure d’ouverture</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} className="rounded-lg border-gray-300" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`horaires.${index}.fermeture`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heure de fermeture</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} className="rounded-lg border-gray-300" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`horaires.${index}.prix`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix par personne</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} className="rounded-lg border-gray-300" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Remove button */}
                  <div className="flex justify-end">
                    {horaireFields.length > 1 && (
                      <Button type="button" variant="destructive" onClick={() => remove(index)} className="px-3 py-2 h-10">
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button type="button" onClick={() => append({ ouverture: '', fermeture: '', prix: 0 })} className="mt-2">
                Ajouter une plage horaire
              </Button>
            </CardContent>
          </Card>

          {/* Dates de fermetures (congés ou fermeture annuelle) */}
          <Card>
            <CardHeader>
              <CardTitle>Dates de fermeture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fermetureFields && fermetureFields.length > 0 ? (
                fermetureFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <FormField
                      control={form.control}
                      name={`fermetures.${index}.debut`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de début</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="rounded-lg border-gray-300" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`fermetures.${index}.fin`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de fin</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="rounded-lg border-gray-300" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="button" variant="destructive" onClick={() => removeFermeture(index)} className="px-3 py-2 h-10">
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucune période de fermeture définie.</p>
              )}
              <Button type="button" onClick={() => appendFermeture({ debut: '', fin: '' })} className="mt-2">
                Ajouter une période de fermeture
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capacité totale du restaurant</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="capaciteTotale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre total de personnes acceptées</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="rounded-lg border-gray-300" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {watchCapaciteTotale > capaciteTheorique && (
                  <Alert variant="destructive" className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Attention</AlertTitle>
                      <AlertDescription>
                          La capacité totale saisie ({watchCapaciteTotale}) est supérieure à la capacité théorique calculée ({capaciteTheorique}) en fonction du nombre de tables.
                      </AlertDescription>
                  </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nombre de tables par taille</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="tables.size2"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tables de 2 personnes</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} className="rounded-lg border-gray-300"/>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="tables.size4"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tables de 4 personnes</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} className="rounded-lg border-gray-300"/>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="tables.size6"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tables de 6 personnes</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} className="rounded-lg border-gray-300"/>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="tables.size8"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tables de 8 personnes</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} className="rounded-lg border-gray-300"/>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
            </CardContent>
          </Card>

          {/* Tables personnalisées */}
          <Card>
            <CardHeader>
              <CardTitle>Tables personnalisées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customTableFields && customTableFields.length > 0 ? (
                customTableFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <FormField
                      control={form.control}
                      name={`customTables.${index}.taille`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taille de la table (personnes)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} className="rounded-lg border-gray-300" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`customTables.${index}.nombre`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de tables</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} className="rounded-lg border-gray-300" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="button" variant="destructive" onClick={() => removeCustomTable(index)} className="px-3 py-2 h-10">
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucune table personnalisée ajoutée.</p>
              )}
              <Button type="button" onClick={() => appendCustomTable({ taille: 0, nombre: 0 })} className="mt-2">
                Ajouter une table personnalisée
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Créneaux de réservation</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="frequenceCreneauxMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fréquence des créneaux (en minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="rounded-lg border-gray-300" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limites de réservation par créneau</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="maxReservationsParCreneau"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre maximum de réservations par créneau</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="rounded-lg border-gray-300" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={updateLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 ease-in-out">
              {updateLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
