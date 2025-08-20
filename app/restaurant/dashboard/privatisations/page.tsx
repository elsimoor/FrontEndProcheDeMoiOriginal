"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useTranslation from "@/hooks/useTranslation";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { gql, useQuery, useMutation } from "@apollo/client";
// Helpers to format prices according to the restaurant's selected currency
import { formatCurrency, currencySymbols } from "@/lib/currency";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const GET_RESTAURANT_SETTINGS = gql`
  query RestaurantForPrivatisation($id: ID!) {
    restaurant(id: $id) {
      id
      settings {
        capaciteTheorique
        frequenceCreneauxMinutes
        currency
      }
    }
  }
`;

const GET_PRIVATISATION_OPTIONS = gql`
  query PrivatisationOptionsByRestaurant($restaurantId: ID!) {
    privatisationOptionsByRestaurant(restaurantId: $restaurantId) {
      id
      nom
      description
      type
      capaciteMaximale
      dureeMaximaleHeures
      menusDeGroupe
      menusDetails {
        nom
        description
        prix
      }
      tarif
      conditions
    }
  }
`;

const CREATE_PRIVATISATION_OPTION = gql`
  mutation CreatePrivatisationOption($input: CreatePrivatisationOptionInput!) {
    createPrivatisationOption(input: $input) {
      id
      nom
      description
      type
      capaciteMaximale
      dureeMaximaleHeures
      menusDeGroupe
      menusDetails {
        nom
        description
        prix
      }
      tarif
      conditions
    }
  }
`;

const UPDATE_PRIVATISATION_OPTION = gql`
  mutation UpdatePrivatisationOption($id: ID!, $input: UpdatePrivatisationOptionInput!) {
    updatePrivatisationOption(id: $id, input: $input) {
      id
      nom
      description
      type
      capaciteMaximale
      dureeMaximaleHeures
      menusDeGroupe
      menusDetails {
        nom
        description
        prix
      }
      tarif
      conditions
    }
  }
`;

const baseFormSchema = z.object({
  nom: z.string().min(1, { message: "Le nom est requis." }),
  description: z.string().optional(),
  type: z.string().min(1, { message: "Le type est requis." }),
  capaciteMaximale: z.coerce.number().positive({ message: "La capacité doit être un nombre positif." }),
  dureeMaximaleHeures: z.coerce.number().positive({ message: "La durée doit être un nombre positif." }),
  // Ancien champ conservé pour compatibilité mais optionnel
  menusDeGroupe: z.array(z.string()).optional(),
  // Nouveaux champs pour la gestion des menus détaillés, du tarif et des conditions
  menusDetails: z.array(
    z.object({
      nom: z.string().min(1, { message: "Le nom du menu est requis." }),
      description: z.string().optional(),
      prix: z.coerce.number().positive({ message: "Le prix doit être un nombre positif." }),
    })
  ).optional(),
  tarif: z.coerce.number().min(0, { message: "Le tarif doit être un nombre positif." }).optional(),
  conditions: z.string().optional(),
});


export default function PrivatisationPage() {
  const { t } = useTranslation();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [existingOptionId, setExistingOptionId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const { data: restaurantData, loading: settingsLoading } = useQuery(GET_RESTAURANT_SETTINGS, {
    variables: { id: restaurantId },
    skip: !restaurantId,
  });
  const settings = restaurantData?.restaurant?.settings;

  // Determine the currency and its symbol from the restaurant settings.  We
  // default to USD when a currency is not specified.  These values
  // are used to format prices and adjust labels throughout the form.
  const currency: string = settings?.currency || 'USD';
  const currencySymbol: string = currencySymbols[currency] ?? currency;

  const formSchema = baseFormSchema
    .refine(data => {
        if (!settings) return true; // Don't validate if settings aren't loaded yet
        return data.capaciteMaximale <= settings.capaciteTheorique;
    }, {
        message: `La capacité maximale ne peut pas dépasser la capacité théorique du restaurant (${settings?.capaciteTheorique || 'N/A'}).`,
        path: ["capaciteMaximale"],
    })
    .refine(data => {
        if (!settings || !settings.frequenceCreneauxMinutes) return true;
        return (data.dureeMaximaleHeures * 60) % settings.frequenceCreneauxMinutes === 0;
    }, {
        message: `La durée doit être compatible avec les créneaux de ${settings?.frequenceCreneauxMinutes || 'N/A'} minutes.`,
        path: ["dureeMaximaleHeures"],
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: "",
      description: "",
      type: "",
      capaciteMaximale: 0,
      dureeMaximaleHeures: 0,
      menusDeGroupe: [],
      menusDetails: [],
      tarif: undefined,
      conditions: "",
    },
  });

  // Field array for dynamic group menus (menusDetails)
  const {
    fields: menuFields,
    append: appendMenu,
    remove: removeMenu,
  } = useFieldArray({
    control: form.control,
    name: "menusDetails",
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

  const { loading: queryLoading, error: queryError } = useQuery(GET_PRIVATISATION_OPTIONS, {
    variables: { restaurantId },
    skip: !restaurantId,
    onCompleted: (data) => {
      if (data.privatisationOptionsByRestaurant && data.privatisationOptionsByRestaurant.length > 0) {
        const option = data.privatisationOptionsByRestaurant[0];
        form.reset({
          nom: option.nom,
          description: option.description || "",
          type: option.type,
          capaciteMaximale: option.capaciteMaximale,
          dureeMaximaleHeures: option.dureeMaximaleHeures,
          menusDeGroupe: option.menusDeGroupe || [],
          menusDetails: option.menusDetails || [],
          tarif: option.tarif ?? undefined,
          conditions: option.conditions || "",
        });
        setExistingOptionId(option.id);
      }
    },
  });

  const [createOption, { loading: createLoading }] = useMutation(CREATE_PRIVATISATION_OPTION);
  const [updateOption, { loading: updateLoading }] = useMutation(UPDATE_PRIVATISATION_OPTION);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!restaurantId) return;

    try {
      let result;
      if (existingOptionId) {
        result = await updateOption({
          variables: {
            id: existingOptionId,
            input: values,
          },
        });
        if (result.data.updatePrivatisationOption) {
            setExistingOptionId(result.data.updatePrivatisationOption.id);
            form.reset(result.data.updatePrivatisationOption);
        }
      } else {
        result = await createOption({
          variables: {
            input: {
              ...values,
              restaurantId: restaurantId,
            },
          },
        });
        if (result.data.createPrivatisationOption) {
            setExistingOptionId(result.data.createPrivatisationOption.id);
            form.reset(result.data.createPrivatisationOption);
        }
      }
      toast.success("Modifications enregistrées");
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue.");
    }
  }

  // Static list of default menu names kept for backward compatibility. New menus
  // should be added via the dynamic menusDetails section below.
  const menuItems = ["Menu A (3 plats)", "Menu B (4 plats)", "Menu C (5 plats)"];

  if (sessionLoading || queryLoading || settingsLoading) {
    return <div className="p-6">{t("loading") || "Loading..."}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t("restaurantPrivatisationsTitle")}</h1>
      </header>

      <Tabs defaultValue="options" className="w-full">
        <TabsList className="border-b border-gray-200 w-full justify-start rounded-none bg-transparent p-0">
          <TabsTrigger value="options" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-gray-900 data-[state=active]:font-bold text-gray-500 rounded-none">
            {t("privatisationOptionsTab")}
          </TabsTrigger>
          <TabsTrigger value="tarifs" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-gray-900 data-[state=active]:font-bold text-gray-500 rounded-none">
            {t("privatisationTarifsTab")}
          </TabsTrigger>
          <TabsTrigger value="conditions" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-gray-900 data-[state=active]:font-bold text-gray-500 rounded-none">
            {t("privatisationConditionsTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="options" className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card className="border-none shadow-none">
                <CardHeader>
                  <CardTitle className="font-bold">{t("privatisationOptionsTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="nom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("privatisationOptionNameLabel")}</FormLabel>
                        <FormControl>
                          <Input placeholder="" {...field} className="rounded-lg border-gray-300" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("privatisationDescriptionLabel")}</FormLabel>
                        <FormControl>
                          <Textarea rows={5} {...field} className="rounded-lg border-gray-300" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("privatisationTypeLabel")}</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-lg border-gray-300" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="capaciteMaximale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("privatisationMaxCapacityLabel")}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="rounded-lg border-gray-300" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dureeMaximaleHeures"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("privatisationMaxDurationLabel")}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="rounded-lg border-gray-300" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-none shadow-none">
                <CardHeader>
                  <CardTitle className="font-bold">{t("privatisationGroupMenusTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dynamic menusDetails using useFieldArray */}
                  {menuFields.length > 0 ? (
                    menuFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        {/* Nom du menu */}
                        <FormField
                          control={form.control}
                          name={`menusDetails.${index}.nom`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("privatisationMenuNameLabel")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("privatisationMenuPlaceholder")} {...field} className="rounded-lg border-gray-300" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Description du menu */}
                        <FormField
                          control={form.control}
                          name={`menusDetails.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("privatisationMenuDescriptionLabel")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("privatisationMenuDescriptionLabel")} {...field} className="rounded-lg border-gray-300" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Prix du menu */}
                        <FormField
                          control={form.control}
                          name={`menusDetails.${index}.prix`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{`${t("privatisationMenuPriceLabel")} (${currencySymbol})`}</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" step="0.01" {...field} className="rounded-lg border-gray-300" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end">
                          <Button type="button" variant="destructive" onClick={() => removeMenu(index)} className="px-3 py-2 h-10">
                            {t("privatisationDeleteMenuButton")}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">{t("privatisationNoGroupMenu")}</p>
                  )}
                  <Button type="button" onClick={() => appendMenu({ nom: '', description: '', prix: 0 })} className="mt-2">
                    {t("privatisationAddGroupMenu")}
                  </Button>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createLoading || updateLoading || settingsLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 ease-in-out">
                  {createLoading || updateLoading ? t("privatisationSaving") : t("privatisationSaveChanges")}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="tarifs" className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card className="border-none shadow-none">
                <CardHeader>
                  <CardTitle className="font-bold">{t("privatisationRatesTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="tarif"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("privatisationRateLabel")}</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} className="rounded-lg border-gray-300" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button type="submit" disabled={createLoading || updateLoading || settingsLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 ease-in-out">
                  {createLoading || updateLoading ? t("privatisationSaving") : t("privatisationSaveChanges")}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        <TabsContent value="conditions" className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card className="border-none shadow-none">
                <CardHeader>
                  <CardTitle className="font-bold">{t("privatisationConditionsTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="conditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("privatisationConditionsLabel")}</FormLabel>
                        <FormControl>
                          <Textarea rows={6} {...field} className="rounded-lg border-gray-300" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button type="submit" disabled={createLoading || updateLoading || settingsLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 ease-in-out">
                  {createLoading || updateLoading ? t("privatisationSaving") : t("privatisationSaveChanges")}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
