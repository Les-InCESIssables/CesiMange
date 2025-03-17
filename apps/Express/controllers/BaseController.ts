import { Router, Request, Response } from "express";
import { BaseMetier } from "../metier/base/BaseMetier";
import { BaseDTO } from "../models/base/BaseDTO";
import { BaseCritereDTO } from "../models/base/BaseCritereDTO";

export class BaseController<DTO extends BaseDTO, CritereDTO extends BaseCritereDTO>
{
    private router: Router;
    private metier: BaseMetier<DTO, CritereDTO>;

    constructor (metier: BaseMetier<DTO, CritereDTO>)
    {
        this.router = Router();
        this.metier = metier;
        this.initializeRoutes();
    }

    private initializeRoutes(): void
    {
        // GET / - R�cup�rer tous les �l�ments
        this.router.get('/', this.getAllItems);

        // GET /:id - R�cup�rer un �l�ment par son ID
        this.router.get('/:id', this.getItemById);

        // POST / - Cr�er un nouvel �l�ment
        this.router.post('/', this.createItem);

        // PUT /:id - Mettre � jour un �l�ment existant
        this.router.put('/:id', this.updateItem);

        // DELETE /:id - Supprimer un �l�ment
        this.router.delete('/:id', this.deleteItem);
    }

    protected getAllItems = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            const critere = req.body as CritereDTO;
            const items = await this.metier.getItems(critere);
            res.status(200).json(items);
        } catch (error)
        {
            res.status(500).json({ error: error instanceof Error ? error.message : "Une erreur inconnue est survenue" });
        }
    };

    protected getItemById = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            const critere = { id: req.params.id } as unknown as CritereDTO; // R�cup�rer l'ID depuis les param�tres de la route
            const item = await this.metier.getItem(critere);
            item ? res.status(200).json(item) : res.status(404).json({ error: "�l�ment non trouv�" });
        } catch (error)
        {
            res.status(500).json({ error: error instanceof Error ? error.message : "Une erreur inconnue est survenue" });
        }
    };

    protected createItem = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            const itemDTO = req.body as DTO; // R�cup�rer les donn�es depuis le body de la requ�te
            const createdItem = await this.metier.createItem(itemDTO);
            res.status(201).json(createdItem);
        } catch (error)
        {
            res.status(400).json({ error: error instanceof Error ? error.message : "Donn�es invalides" });
        }
    };

    protected updateItem = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            const itemDTO = req.body as DTO; // R�cup�rer les donn�es depuis le body de la requ�te
            const critere = { id: req.params.id } as unknown as CritereDTO; // R�cup�rer l'ID depuis les param�tres de la route
            const updatedItem = await this.metier.updateItem(itemDTO, critere);
            res.status(200).json(updatedItem);
        } catch (error)
        {
            res.status(400).json({ error: error instanceof Error ? error.message : "Donn�es invalides" });
        }
    };

    protected deleteItem = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            const critere = { id: req.params.id } as unknown as CritereDTO; // R�cup�rer l'ID depuis les param�tres de la route
            const success = await this.metier.deleteItem(critere);
            success ? res.status(204).send() : res.status(404).json({ error: "�l�ment non trouv�" });
        } catch (error)
        {
            res.status(500).json({ error: error instanceof Error ? error.message : "Une erreur inconnue est survenue" });
        }
    };

    public getRouter(): Router
    {
        return this.router;
    }
}