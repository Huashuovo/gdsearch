export interface LevelData {
    ID: number;
    Rating: number|null;
    Enjoyment: number|null;
    Deviation: number|null;
    RatingCount: number|null;
    EnjoymentCount: number|null;
    SubmissionCount: number|null;
    TwoPlayerRating: number | null;
    TwoPlayerEnjoyment: number | null;
    TwoPlayerDeviation: number | null;
    DefaultRating: number | null;
    Showcase: string|null;
    Popularity: number|null;
    Meta: {
      ID?: number| null;
      Name?: string| null;
      Description?: string | null;
      SongID?: number| null;
      Length?: number| null;
      IsTwoPlayer?: boolean| null;
      Difficulty?: string| null;
      Song: {
        ID?: number| null;
        Name?: string| null;
        Author?: string| null;
        Size?: string| null;
      };
      Publisher?: {
        name?: string | null;
      }
    };
  }
  
  export interface SearchData{
    totle:number;
    limit:number;
    page:number;
    levels:LevelData[];
  }

  export interface LevelObj{
    LevelId:string;
    LevelName:string;
    GameVersion:string;
    PlayerId:string;
    DifficultyDenominator:string;
    DifficultyNumerator:string;
    Downloads:string;
    OfficialSong:string;
    LevelVersion:string;
    Likes:string;
    IsDemon:string;
    DemonDifficulty:string;
    IsAuto:string;
    Stars:string;
    FeatureScore:string;
    Epic:string;
    Objects:string;
    Description:string;
    Length:string;
    CopiedId:string;
    IsTwoPlayer:string;
    Coins:string;
    VerifiedCoins:string;
    StarsRequested:string;
    EditorTime:string;
    CopiedEditorTime:string;
    CustomSongId:string;
  }
  export interface CreatorObj{
    CreatorId: string; 
    CreatorName: string;
  }
  export interface SongObj{
    SongId?:string;
    SongName:string;
    ArtistId?:string;
    ArtistName:string;
    SongSize?:string;
    VideoId?:string;
    SongLink?:string;
    SongYoutubeUrl?:string;
    IsVerified?:string;
  }
  export interface PageInfoObj{
    Totol:string;
    Offset:string;
    Amount:string;
  }

  export interface GdLevelData{
    Level:LevelObj;
    Creator:CreatorObj;
    Song:SongObj;
    PageInfo:PageInfoObj;
  }

  export interface GdSongFileHub {
    _id: string;
    name: string;
    songURL: string;
    urlHash: string;
    songName: string;
    ytVideoID: string;
    songID: string;
    state: string;
    filetype: string; 
    downloadUrl: string;
    levelID: string;
    __v: number; 
    downloads: number;
  }

  export interface TagData{
    TagID: number;
    ReactCount: number;
    HasVoted: number;
    Tag: {
      ID: number;
      Name: string;
      Description: string;
      Ordering: number;
    }
  }